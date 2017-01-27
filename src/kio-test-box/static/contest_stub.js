//copied from dces2
var solutions_loaders_registry = {};
var problem_id_2_answer = [];

function register_solution_loader(problem_type, loader) {
    solutions_loaders_registry[problem_type] = loader;
}

function get_problem_index($problem_div) {
    return 0; //all problems have pid=0, because we anyway are not interested in their solutions
}

function submit_answer(problem_id, answer) {
    problem_id_2_answer[problem_id] = answer;
}

$(function() {

    function load_answer_for_problem($problem_div, ans) {
        var type = $problem_div.find('.pr_type').text();
        solutions_loaders_registry[type]($problem_div, ans);
    }

    //load solutions for all problems
    $('.problem').each(function() {
        var $problem_div = $(this);
        load_answer_for_problem($problem_div, null);
    });

    //make links switch problems view
    $('a.switch-problem').click(function() {
        var $a = $(this);
        $a.parents('.problem-statement-answer').find('.problem').each(function() {
            var $problem = $(this);
            if ($problem.hasClass('hidden'))
                $problem.removeClass('hidden');
            else
                $problem.addClass('hidden');
        });

        var enteredAns = problem_id_2_answer[0];
        var $problem_div = $($('.problem').get(1));
        load_answer_for_problem($problem_div, enteredAns);

        return false;
    });
});