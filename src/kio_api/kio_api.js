import {initialize_controls} from './kio_controls'
import {LOCALIZATION} from "./localization";

/**
 * @param ProblemClass Problem class, it will be called as new ProblemClass(settings).
 * @param domNode html5 dom element
 * @param settings object to be passed to ProblemClass
 * @param basePath optional, base path to resolve manifest element from
 */
export function initializeKioProblem(ProblemClass, domNode, settings, basePath) {
    let preloadManifest = getPreloadManifest(ProblemClass, settings);

    let load_best_from_server = true;
    let load_autosaved = true;

    let loadingInfoDiv = createLoadingInfoElement();
    domNode.appendChild(loadingInfoDiv);

    if (preloadManifest) {
        let queue = new createjs.LoadQueue(true, basePath);
        queue.on("complete", finalizeInitialization, null, false, {loading_queue: queue});
        queue.on("error", errorLoadingResources);
        queue.on("progress", loadingProgressChanged);

        queue.loadManifest(preloadManifest);
    } else
        finalizeInitialization(null, {loading_queue: null});

    function finalizeInitialization(evt, {loading_queue}) {

        let problem = new ProblemClass(settings);
        enrichProblem(problem);

        loadingInfoDiv.innerText = KioApi.translate('Загрузка лучшего решения', settings); //TODO this is not shown because JS is not finished
        if (!load_best_from_server && console && console.debug)
            console.debug('trying to reinit without loading best from server');
        loadingInfoDiv.innerText = KioApi.translate('Загрузка автоматически сохраненного решения', settings);
        if (!load_autosaved && console && console.debug)
            console.debug('trying to reinit without loading autosaved');

        if (load_best_from_server && load_autosaved) //remove only the first time
            domNode.removeChild(loadingInfoDiv);

        let kioapi = new KioApi(problem, domNode, loading_queue);
        kioapi.basePath = basePath;

        kioapi.init_view(domNode, problem);

        kioapi.saveEmptySolution();

        if (load_best_from_server && !kioapi.loadSolution(kioapi.best_from_server, 'best-from-server')) {
            load_best_from_server = false;
            kioapi.uninit_view(domNode);
            finalizeInitialization(evt, {loading_queue});
            return;
        }
        //TODO get rid of code duplication
        if (load_autosaved && !kioapi.loadSolution(kioapi.autosavedSolution(), 'autosaved')) {
            load_autosaved = false;
            kioapi.uninit_view(domNode);
            finalizeInitialization(evt, {loading_queue});
            return;
        }

        kioapi.problem_is_initialized = true;
    }

    function getPreloadManifest(ProblemClass, settings) {
        if (ProblemClass.preloadManifest)
            return ProblemClass.preloadManifest();
        if (ProblemClass.prototype.preloadManifest) {//legacy variant, is deprecated
            let problem = new ProblemClass(settings);
            return problem.preloadManifest();
        }
        return false;
    }

    function errorLoadingResources() {
        loadingInfoDiv.innerText = KioApi.translate("Ошибка при загрузке задачи, попробуйте обновить страницу", settings);
    }

    function loadingProgressChanged(evt) {
        loadingInfoDiv.innerText = KioApi.translate("Загрузка ", settings) + Math.round(100 * evt.progress) + "%";
    }

    function createLoadingInfoElement() {
        let infoDiv = document.createElement("div");
        infoDiv.className = "loading-info";
        return infoDiv;
    }

    function enrichProblem(problem) {
        Object.defineProperty(problem, 'settings', {get: () => settings});

        let language = get_language_from_settings(settings);
        Object.defineProperty(problem, 'language', {get: () => language});
        problem.message = function(message_id) {
            let localization = ProblemClass.LOCALIZATION;
            if (!localization)
                return message_id;
            let messages = localization[language];
            if (!messages || !messages[message_id]) {
                if (language !== 'ru')
                    console.debug('no localization for', message_id, 'language', language);
                return message_id;
            }

            return messages[message_id];
        }
    }
}

class KioApi {

    constructor(problem, domNode, loading_queue) {
        this.problem = problem;
        this.domNode = domNode;
        this.pid = dces2contest.get_problem_index($(domNode));

        this.best_from_server = best_solutions[this.pid];

        this.best = null;
        this.bestResult = null;
        this.autosave_localstorage_key = 'kio-problem-' + dces2contest.contest_local_storage_key(this.pid) + '-autosave';
        this.autosave_localstorage_key_legacy = 'kio-problem-' + this.problem.id() + '-autosave';

        this.loading_queue = loading_queue;

        this.problem_is_initialized = false;
        this.basePath = '';
    }

    //FIXME here 1
    submitGaEvent(category, action, label) {
        if ('ga' in window) {
            ga('set', 'nonInteraction', true);
            ga('send', 'event', {
                eventCategory: category,
                eventAction: action,
                eventLabel: navigator.userAgent + (label ? ' -> ' + label : ''),
                eventValue: 0
            });
        }
    }

    saveEmptySolution() {
        this.emptySolution = this.problem.solution();
    }

    //returns was loading ok or not
    loadSolution(solution, message) {
        if (solution !== null) {
            try {
                this.problem.loadSolution(solution);
                return true;
            } catch (e) {
                if (console && console.debug)
                    console.debug('error loading solution', solution, e);
                this.submitGaEvent(
                    'Failed to load solution',
                    JSON.stringify(solution),
                    this.problem.id() + (message ? ' ' + message : '')
                );
                return false;
            }
        }
        return true;
    }

    bestSolution() {
        return this.best;
    }

    autosavedSolution() {
        let sol_string = localStorage.getItem(this.autosave_localstorage_key);
        if (sol_string == null)
            sol_string = localStorage.getItem(this.autosave_localstorage_key_legacy);
        return JSON.parse(sol_string);
    }

    autosaveSolution() {
        if (!this.problem_is_initialized)
            return;

        let solution = this.problem.solution();
        if (solution != null) //don't save null solutions
            localStorage.setItem(this.autosave_localstorage_key, JSON.stringify(solution))
    }

    newRecord(solution, result) {
        if (!this.problem_is_initialized)
            return;

        dces2contest.submit_answer(this.pid, {
            sol: JSON.stringify(solution),
            res: JSON.stringify(result)
        });
    }

    submitResult(result) {
        this.last_submitted_result = result;

        this.results_info_panel.setParams(result);

        this.autosaveSolution();

        let cmp = this.compareResults(result, this.bestResult);

        if (cmp > 0) {
            this.bestResult = result;
            this.best = this.problem.solution();
            this.newRecord(this.best, result);

            this.record_info_panel.setParams(result);
        }
    }

    compareResults(result1, result2) {
        if (result1 == null && result2 == null)
            return 0;
        if (result1 == null)
            return -1;
        if (result2 == null)
            return 1;

        let params = this.problem.parameters();
        for (let param of params) {
            let val1 = result1[param.name];
            let val2 = result2[param.name];

            let val1_no_normalization = val1;
            let val2_no_normalization = val2;
            if (param.normalize) {
                val1 = param.normalize(val1);
                val2 = param.normalize(val2);
            }

            let diff = param.ordering === 'maximize' ? val1 - val2 : val2 - val1;

            if (Math.abs(diff) > 1e-9) {
                if (diff > 0)
                    return 1;
                else
                    return -1;
            }
        }

        return 0;
    }

    getResource(id) {
        return this.loading_queue.getResult(id);
    }

    getResourceImageAsDataURL(id, mime='image/png', encoderOptions=null) {
        let image = this.getResource(id);
        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext('2d').drawImage(image, 0, 0);
        return canvas.toDataURL(mime, encoderOptions);
    }

    init_view(domNode, problem) {
        let problemDiv = document.createElement('div');
        let controlsDiv = document.createElement('div');

        problemDiv.className = 'kio-base-box';

        domNode.appendChild(problemDiv);
        domNode.appendChild(controlsDiv);

        initialize_controls(controlsDiv, this);

        let preferred_width = $(domNode).width() - 12;
        problem.initialize(problemDiv, this, preferred_width); //2 * margin == 6
    }

    uninit_view(domNode) {
        while (domNode.firstChild)
            domNode.removeChild(domNode.firstChild);
    }

    translate(message) {
        return KioApi.translate(message, this.problem.settings);
    }

    static translate(message, settings) {
        let language = get_language_from_settings(settings);
        let l = LOCALIZATION[message];
        if (!l || !l[language])
            return message;
        return l[language];
    }
}

function get_language_from_settings(settings) {
    if (settings && settings.language)
        return settings.language;
    return 'ru';
}

dces2contest.register_solution_loader('kio-online', load_kio_solution);

let best_solutions = [];

function load_kio_solution($problem_div, answer) {
    if (!answer)
        return;

    if (!answer.sol)
        return;

    let solution = JSON.parse(answer.sol);

    let pid = dces2contest.get_problem_index($problem_div);
    best_solutions[pid] = solution;
}

//TODO do not fail on non-parsable solutions
