import {Button} from './kio_controls'

export class StoredSolutions {
    constructor(kio_api) {
        this.kio_api = kio_api;
        this.init_interface();

        //get all solutions
        let all_data_keys = dces2contest.get_all_problem_data_keys(kio_api.pid);

        let prefix = 'save-';

        for (let data_key of all_data_keys)
            if (data_key.substr(0, prefix.length) == prefix) {
                let id = data_key.substr(prefix.length);
                let sol = Solution.load(this, id);
                if (sol !== null)
                    this.solutions_node.appendChild(sol.domNode);
            }
    }

    init_interface() {
        this.domNode = document.createElement('div');
        this.domNode.className = 'kio-base-solutions-container';

        let title = document.createElement('div');
        title.className = 'title';
        title.innerText = 'Сохраненные решения';
        this.domNode.appendChild(title);

        this.new_solution_node = document.createElement('div');
        this.new_solution_node.className = 'kio-base-new-solution';
        let label = document.createElement('span');
        label.innerText = 'Назовите решение:';
        this.new_name = document.createElement('input');
        this.new_solution_node.appendChild(label);
        this.new_solution_node.appendChild(this.new_name);
        this.new_solution_node.appendChild(new Button('Сохранить', e => {
            let name = this.new_name.value;

            if (!name)
                return;

            let sol = Solution.create(this, name, this.kio_api.problem.solution(), this.kio_api.last_submitted_result);
            if (this.solutions_node.childNodes.length == 0)
                this.solutions_node.appendChild(sol.domNode);
            else
                this.solutions_node.insertBefore(sol.domNode, this.solutions_node.childNodes[0]);

            this.new_name.value = '';
        }).domNode);
        this.message_node = document.createElement('span');
        this.new_solution_node.appendChild(this.message_node);
        this.domNode.appendChild(this.new_solution_node);

        this.solutions_node = document.createElement('tbody');
        let solutions_table = document.createElement('table');
        solutions_table.appendChild(this.solutions_node);
        this.domNode.appendChild(solutions_table);
    }
}

class Solution {

    static load(stored_solutions, id) {
        let data_key = 'save-' + id;
        let problemDataSerialized = dces2contest.get_problem_data(stored_solutions.kio_api.pid, data_key);
        if (problemDataSerialized === '')
            return null;

        let problemData = JSON.parse(problemDataSerialized);
        let name = problemData.name;
        let solution = problemData.solution;
        let result = problemData.result;

        return new Solution(stored_solutions, id, name, solution, result);
    }

    static create(stored_solutions, name, solution, result) {
        let id = Solution.makeid(10);
        let sol = new Solution(stored_solutions, id, name, solution, result);
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

    constructor(stored_solutions, id, name, solution, result) {
        this.stored_solutions = stored_solutions;
        this.kio_api = stored_solutions.kio_api;
        this.id = id;
        this.data_key = 'save-' + id;
        this.name = name;
        this.solution = solution;
        this.result = result;
        this.init_interface();
    }

    remove() {
        dces2contest.save_problem_data(this.kio_api.pid, this.data_key, '');
    }

    save() {
        dces2contest.save_problem_data(this.kio_api.pid, 'save-' + this.id, JSON.stringify({
            name: this.name,
            solution: this.solution,
            result: this.result
        }));
    }

    init_interface() {
        this.domNode = document.createElement('tr');
        this.domNode.className = 'kio-base-stored-solution';

        this.nameNode = document.createElement('span');
        this.nameNode.innerText = this.name;

        this.loadButton = new Button('Загрузить', e => {
            this.kio_api.problem.loadSolution(this.solution);
        }).domNode;
        this.removeButton = new Button('Ctrl+Удалить', e => {
            if (!e.ctrlKey)
                return;
            //remove from dom
            this.domNode.parentNode.removeChild(this.domNode);
            //remove from server
            this.remove();
        }).domNode;

        let td1 = document.createElement('td');
        let td2 = document.createElement('td');
        let td3 = document.createElement('td');
        td1.className = 'first';
        td3.className = 'second';
        td1.appendChild(this.nameNode);
        td2.appendChild(this.loadButton);
        td2.appendChild(this.removeButton);
        this.domNode.appendChild(td1);
        this.domNode.appendChild(td3);
        this.domNode.appendChild(td2);

        td3.innerText = this.kio_api.results_info_panel.as_string(this.result);

        //TODO порядок сохраненных решений перемешивается
    }

}