import {initialize_controls} from './kio_controls'

export function initializeKioProblem(ProblemClass, domNode, settings) {
    let problem = new ProblemClass(settings);

    let loadingInfoDiv = createLoadingInfoElement();
    domNode.appendChild(loadingInfoDiv);

    if (problem.preloadManifest) {
        let queue = new createjs.LoadQueue();
        queue.on("complete", finalizeInitialization, null, false, {loading_queue: queue});
        queue.on("error", errorLoadingResources);
        queue.on("progress", loadingProgressChanged);

        let manifest = problem.preloadManifest(); //TODO move settings to constructor, so manifest may depend on settings
        queue.loadManifest(manifest);
    } else
        finalizeInitialization(null, {loading_queue: null});

    function finalizeInitialization(evt, {loading_queue}) {
        domNode.removeChild(loadingInfoDiv);

        let kioapi = new KioApi(problem, domNode, loading_queue);

        kioapi.init_view(domNode, problem, settings);

        kioapi.saveEmptySolution();
        kioapi.loadSolution(kioapi.bestSolution());
        kioapi.loadSolution(kioapi.autosavedSolution());

        kioapi.problem_is_initialized = true;
    }
    
    function errorLoadingResources() {
        loadingInfoDiv.innerText = "Ошибка при загрузке задачи, попробуйте обновить страницу";
    }
    
    function loadingProgressChanged(evt) {
        loadingInfoDiv.innerText = "Загрузка " + evt.progress + "%";
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

        this.best = $(this.domNode).data('best-solution');
        this.bestResult = null;
        this.autosave_localstorage_key = 'kio-problem-' + this.problem.id() + '-autosave';

        this.loading_queue = loading_queue;

        this.problem_is_initialized = false;
    }

    saveEmptySolution() {
        this.emptySolution = this.problem.solution();
    }

    loadSolution(solution) {
        if (solution !== null)
            this.problem.loadSolution(solution);
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

    newRecord() {
        if (!this.problem_is_initialized)
            return;

        dces2contest.submit_answer(this.pid, this.best);
    }

    submitResult(result) {
        this.results_info_panel.setParams(result);

        this.autosaveSolution();

        let cmp = this.compareResults(result, this.bestResult);

        if (cmp > 0) {
            this.bestResult = result;
            this.best = this.problem.solution();
            this.newRecord(this.best);

            this.record_info_panel.setParams(result);
        }

        //TODO update view with current info
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

    get_resource(id) {
        return this.loading_queue.getResult(id);
    }

    init_view(domNode, problem, settings) {
        let problemDiv = document.createElement('div');
        let controlsDiv = document.createElement('div');

        domNode.appendChild(problemDiv);
        domNode.appendChild(controlsDiv);

        ({results_info_panel: this.results_info_panel, record_info_panel: this.record_info_panel}
            = initialize_controls(controlsDiv, this));

        problem.initialize(problemDiv, this, settings);
    }
}

dces2contest.register_solution_loader('kio-online', load_kio_solution);

function load_kio_solution($problem_div, answer) {
    $problem_div.data('best-solution', answer);
}