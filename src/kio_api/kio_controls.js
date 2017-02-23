import './kio.scss'

export function initialize_controls(controlsDiv, kioapi) {
    let results_info_panel = new InfoPanel("Результат", kioapi.problem.parameters());
    let record_info_panel = new InfoPanel("Рекорд", kioapi.problem.parameters());

    controlsDiv.appendChild(results_info_panel.domNode);
    controlsDiv.appendChild(record_info_panel.domNode);

    results_info_panel.domNode.className += " kio-base-results-info-panel";
    record_info_panel.domNode.className += " kio-base-record-info-panel";

    let button_clear = new Button('Очистить решение', function() {
        kioapi.problem.loadSolution(kioapi.emptySolution);
    });
    let button_load_record = new Button('Загрузить рекорд', function() {
        kioapi.problem.loadSolution(kioapi.best);
    });

    results_info_panel.domNode.appendChild(button_clear.domNode);
    record_info_panel.domNode.appendChild(button_load_record.domNode);

    controlsDiv.className = 'kio-base-controls-container';
    let spanner = document.createElement('div');
    spanner.className = 'kio-base-clear-both';
    controlsDiv.appendChild(spanner);

    return {results_info_panel, record_info_panel};
}

export class InfoPanel {
    constructor(title, params) { //params as in problem description
        this.title = title;
        this.params = params;

        this.domNode = document.createElement('div');
        this.inject_inside(this.domNode);
    }

    setParams(nameValueObject) {
        let ind = 0;
        for (let param of this.params) {
            if (!param.title)
                continue;
            let td_val = this.value_elements[ind];
            let value = nameValueObject[param.name];
            td_val.innerText = this.paramViewFunction(param)(value);
            ind++;
        }
    }

    paramViewFunction(param) {
        if (!param.view)
            return v => v;

        if (typeof param.view === "function")
            return param.view;

        return v => v + param.view;
    }

    inject_inside(domNode) {
        domNode.className = 'kio-base-info-panel';

        this.param_name_2_param = {};
        this.param_name_2_value_element = {};

        let table = document.createElement('table');
        let table_head = document.createElement('thead');
        let table_body = document.createElement('tbody');

        table_head.className = 'kio-base-info-panel-head';

        table.appendChild(table_head);
        table.appendChild(table_body);

        //init head
        let tr_head = document.createElement('tr');
        let td_head = document.createElement('td');
        td_head.colspan = 2;
        table_head.appendChild(tr_head);
        tr_head.appendChild(td_head);
        td_head.innerText = this.title;

        //init body
        this.value_elements = [];
        for (let param of this.params) {
            if (!param.title) //no title means the param is invisible
                continue;

            let tr = document.createElement('tr');
            let td_name = document.createElement('td');
            let td_val = document.createElement('td');
            tr.appendChild(td_name);
            tr.appendChild(td_val);

            td_name.className = 'kio-base-info-panel-param-name';
            td_val.className = 'kio-base-info-panel-param-value';

            td_name.innerText = param.title;

            table_body.appendChild(tr);

            // this.param_name_2_value_element[param.name] = td_val;
            // this.param_name_2_param[param.name] = param;
            this.value_elements.push(td_val);
        }

        domNode.appendChild(table);
    }
}

export class Button {

    constructor(title, handler) {
        this.domNode = document.createElement('button');
        this.domNode.className = "kio-base-control-button";
        this.title = title;
        $(this.domNode).click(handler);
    }

    set title(title) {
        this._title = title;
        this.domNode.innerText = title;
    }

    get title() {
        return this._title;
    }

}