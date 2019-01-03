import './static/index.html'
import './static/jquery-1.7.2.min.js'
import './static/preloadjs-1.0.0.min.js'

export function register_solution_loader(problem_type, loader) {
    solutions_loaders_registry[problem_type] = loader;
}

export function get_problem_index($problem_div) {
    return 0;
}

export function submit_answer(problem_id, answer) {
    console.log('submitting to server', answer);
    let answerString = JSON.stringify(answer);
    localStorage.setItem(contest_local_storage_key(), answerString);
}

export function save_problem_data(problem_id, data_key, value) {
    let key = get_local_storage_key_for_data_key(problem_id, data_key);
    localStorage.setItem(key, value);
}

export function get_problem_data(problem_id, data_key) {
    let key = get_local_storage_key_for_data_key(problem_id, data_key);
    return localStorage.getItem(key);
}

export function get_all_problem_data_keys(problem_id) {
    let res = [];
    let problem_key = contest_local_storage_key(problem_id);
    let prefix = problem_key + '-';
    let prefix_len = prefix.length;

    //iterate all keys http://stackoverflow.com/a/8419509/1826120
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key.substr(0, prefix_len) == prefix)
            res.push(key.substr(prefix.length));
    }

    return res;
}

const solutions_loaders_registry = {};

//TODO it is better to use problem string id, but we do not have access to it here
export function contest_local_storage_key(problem_id) {
    return 'contest-stub-storage-' + $('#stud-unique-id').text();
}

function get_local_storage_key_for_data_key(problem_id, data_key) {
    return contest_local_storage_key(problem_id) + '-' + data_key;
}

$(function () {
    let best = JSON.parse(localStorage.getItem(contest_local_storage_key()));
    solutions_loaders_registry['kio-online']($('#problem'), best);
});
