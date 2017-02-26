export class StoredSolutions {
    constructor(kio_api) {
        this.kio_api = kio_api;
        //get all solutions
        let all_data_keys = dces2contest.get_all_problem_data_keys(kio_api.pid);

        let prefix = 'save-';

        this.solutions = [];
        for (let data_key of all_data_keys)
            if (data_key.substr(0, prefix.length) == prefix) {
                let id = data_key.substr(prefix.length);
                let sol = Solution.load(id);
                if (sol !== null)
                    this.solutions.push(sol);
            }

        this.init_interface();
    }

    init_interface() {
        this.domNode = document.createElement('div');
        this.domNode.className = 'kio-base-solutions-container';

        let title = document.createElement('div');
        title.className = 'title';
        title.innerText = 'Сохраненные решения';
        this.domNode.appendChild(title);
    }
}

class Solution {

    static load(kio_api, id) {
        let data_key = 'save-' + id;
        let problemDataSerialized = dces2contest.get_problem_data(data_key);
        if (problemDataSerialized === '')
            return null;

        let problemData = JSON.parse(problemDataSerialized);
        let name = problemData.name;
        let solution = problemData.solution;

        return new Solution(kio_api, id, name, solution);
    }

    static create(kio_api, name, solution) {
        let id = Solution.makeid(10);
        let sol = new Solution(kio_api, id, name, solution);
        sol.save();
        return sol;
    }

    //http://stackoverflow.com/a/1349426/1826120
    static makeid() {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < 10; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    constructor(kio_api, id, name, solution) {
        this.kio_api = kio_api;
        this.id = id;
        this.data_key = 'save-' + id;
        this.name = name;
        this.solution = solution;
        this.init_interface();
    }

    remove() {
        dces2contest.save_problem_data(this.kio_api.pid, this.data_key, '');
    }

    save() {
        dces2contest.save_problem_data(this.kio_api.pid, 'save-' + id, JSON.stringify({
            name: this.name,
            solution: this.solution
        }));
    }

    init_interface() {
        this.domNode = document.createElement('div');
        this.domNode.className = 'kio-base-stored-solution';
    }
}