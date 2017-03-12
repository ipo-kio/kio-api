import {initialize_controls} from './kio_controls'

/**
 * @param ProblemClass Problem class, it will be called as new ProblemClass(settings).
 * @param domNode html5 dom element
 * @param settings object to be passed to ProblemClass
 * @param basePath optional, base path to resolve manifest element from
 */
export function initializeKioProblem(ProblemClass, domNode, settings, basePath) {
    let problem = new ProblemClass(settings);

    let loadingInfoDiv = createLoadingInfoElement();
    domNode.appendChild(loadingInfoDiv);

    if (problem.preloadManifest) {
        let queue = new createjs.LoadQueue(true, basePath);
        queue.on("complete", finalizeInitialization, null, false, {loading_queue: queue});
        queue.on("error", errorLoadingResources);
        queue.on("progress", loadingProgressChanged);

        let manifest = problem.preloadManifest();
        queue.loadManifest(manifest);
    } else
        finalizeInitialization(null, {loading_queue: null});

    let load_best_from_server = true;
    let load_autosaved = true;

    function finalizeInitialization(evt, {loading_queue}) {
        if (!load_best_from_server)
            console.debug('trying to reinit without loading best from server');
        if (!load_autosaved)
            console.debug('trying to reinit without loading autosaved');

        if (load_best_from_server && load_autosaved) //remove only the first time
            domNode.removeChild(loadingInfoDiv);

        let kioapi = new KioApi(problem, domNode, loading_queue);

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

    function errorLoadingResources() {
        loadingInfoDiv.innerText = "Ошибка при загрузке задачи, попробуйте обновить страницу";
    }

    function loadingProgressChanged(evt) {
        loadingInfoDiv.innerText = "Загрузка " + Math.round(100 * evt.progress) + "%";
    }

    function createLoadingInfoElement() {
        let infoDiv = document.createElement("div");
        infoDiv.className = "loading-info";
        return infoDiv;
    }
}

class KioApi {

    constructor(problem, domNode, loading_queue) {
        this.problem = problem;
        this.domNode = domNode;
        this.pid = dces2contest.get_problem_index($(domNode));

        this.best_from_server = best_solutions[dces2contest.get_problem_index($(domNode))];

        this.best = null;
        this.bestResult = null;
        this.autosave_localstorage_key = 'kio-problem-' + this.problem.id() + '-autosave';

        this.loading_queue = loading_queue;

        this.problem_is_initialized = false;
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
                this.submitGaEvent(
                    'Failed to load solution',
                    JSON.stringify(solution),
                    this.problem.id() + (message ? ' ' + message : '')
                );
                return false;
            }
        }
    }

    bestSolution() {
        return this.best;
    }

    autosavedSolution() {
        return JSON.parse(localStorage.getItem(this.autosave_localstorage_key));
    }

    autosaveSolution() {
        if (!this.problem_is_initialized)
            return;

        localStorage.setItem(this.autosave_localstorage_key, JSON.stringify(this.problem.solution()))
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