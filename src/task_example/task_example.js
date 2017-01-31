import './task_example.scss'

//создаем класс TaskExample, конструктор может быть пустым
export function TaskExample() {
}

//следующие функции требуется реализовать, это как будто реализация интерфейса

TaskExample.prototype.id = function () {
    return "TaskExample";
};

//функция инициализации, в этой функции можно создавать интерфейс задачи
TaskExample.prototype.initialize = function (domNode, kioapi, settings) {
    //сохраняем kioapi для будущего использования
    this.kioapi = kioapi;
    this.settings = settings;
    this.domNode = domNode;

    //settings могут иметь произвольные данные для инициализации, например, уровень
    console.log('problem level is', this.settings.level);

    //инициализируем интерфейс
    //инициализируем содержимое задачи в элементе domNode
    var $domNode = $(this.domNode);
    this.initInterface($domNode);
};

/*
Будем считать, что во всех задачах сравнение решений участников происходит с помощью сравнения значений нескольких параметров.
Например, в задаче про 3x + 1 сначала будем сравнивать количество шагов, которые приводят к единице, и будет требовать,
чтобы количество шагов было как можно больше. Если количество шагов одинаковое, то смотрим на максимальное число, которое
получается при выполнении шагов. Оно должно быть как можно меньше.
Соответственно, нет необходимости самостоятельно писать сравнение результатов решений, достаточно только описать параметры
 */
TaskExample.prototype.parameters = function () {
    return [
        {
            name: "steps", //название параметра
            title: "Количество шагов", //отображение названия для пользователя
            ordering: 'maximize', // 'maximize' - надо как можно больше, 'minimize' - как можно меньше
            view: "ш" // отображение значения параметра пользователю. Можно не указывать.
                      // Если задана строка, как в этом примере, она означает постфикс, т.е. если значение
                      // параметра равно, например, 42, пользователь увидит 42ш.
                      // Либо это может быть функция от одного аргумента, значения параметра, она
                      // должна возвращать строку для отображения пользователю
        },
        {
            name: "max",
            title: "Максимальное число",
            ordering: 'minimize',
            view: function (val) {
                return '[' + val + ']'
            }
        }
    ];
};

//возвращает текущее решение в виде объекта, он будет сериализован с помощью JSON.stringify для хранения и передачи по сети
TaskExample.prototype.solution = function () {
    var x = this.process == null ? 0 : this.process.x;
    return {x : x};
};

//требование загрузить решение
TaskExample.prototype.loadSolution = function (solution) {
    if (!solution || !solution.x)
        return;
    var x = solution.x;
    if (x <= 0 || x >= 1000)
        return;
    this.$input.val('' + x).change();

    // this.updateView();
};

//далее идут приватные методы

TaskExample.prototype.initInterface = function ($domNode) {
    this.$input = $("<input class='number-input' size='3'>");
    this.$output = $("<textarea class='steps-view' readonly='readonly'></textarea>");

    $domNode.append(this.$input, this.$output);

    var thisProblem = this;

    this.$input.change(function(evt) {
        var x = +thisProblem.$input.val();
        if (!x || x <= 0 || x >= 1000)
            thisProblem.process = null;
        else
            thisProblem.process = new ThreeXPlusOneProcess(x);

        if (thisProblem.process != null)
            thisProblem.kioapi.submitResult({
                steps: thisProblem.process.length(),
                max: thisProblem.process.max()
            });
        thisProblem.updateView();
    });

    this.loadSolution({x: 5});
};

TaskExample.prototype.updateView = function () {
    if (this.process == null)
        this.$output.text('Неверный ввод');
    else
        this.$output.text(this.process.steps.join(' -> ') + '\n\n' + this.process.max());
};

//модель
function ThreeXPlusOneProcess(x) {
    this.x = x;
    this.steps = [x];
    while (x != 1) {
        if (x % 2 == 0)
            x = x / 2;
        else
            x = 3 * x + 1;
        this.steps.push(x);
    }
}

ThreeXPlusOneProcess.prototype.length = function () {
    return this.steps.length;
};

ThreeXPlusOneProcess.prototype.max = function () {
    var max = 0;

    for (var i = 0; i < this.steps.length; i++)
        if (max < this.steps[i])
            max = this.steps[i];

    return max;
};