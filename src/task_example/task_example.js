/**
 * Задача. Процесс "3x+1" устроен так. Он начинается с натурального числа, если оно четное, его надо поделить на два.
 * Если нечетное, то x -> 3x + 1. Для всех чисел от 1 до 999 этот процесс рано или поздно приводит к 1.
 * Нужно придумать начальное число от 1 до 999 так, чтобы количество шагов было как можно больше, при этом, чтобы
 * максимальное число, полученное в процессе, было как можно меньше. Т.е. участник вводит одно число, а программа
 * считает два параметра. Количество шагов перед приходом к единице и максимальное число, которое при этом получается.
 * Первый параметр должен быть как можно больше, второй — как можно меньше.
 */

//это требуется для компиляции scss файла со стилями для задачи, без webpack эта строка не нужна
import './task_example.scss'
import './static/collatz_conjecture.png'

/**
 * создаем класс TaskExample, конструктор может быть пустым, инициализация происходит позже
 * @param settings произвольный объект настроек "манпулятора", в первую очередь, из этого объекта нужно брать
 * информацию об уровне. Можно реализовать это прямолинейно так, что settings = {level : 2}
 * @constructor
 */
export function TaskExample(settings) {
    this.settings = settings;
}

//следующие функции требуется реализовать, это как будто реализация интерфейса

/**
 * строковый идентификатор задачи. В данный момент используется только для того, чтобы сформировать
 * ключ для localStorage для хранения автоматически сохраненных решений.
 */
TaskExample.prototype.id = function () {
    return "TaskExample";
};

/**
 * Функция инициализации, в этой функции можно создавать интерфейс задачи и уже можно пользоваться KioApi
 * @param domNode dom-узел, который нужно наполнять содержимым задачи
 * @param kioapi ссылка на api для совершения всех действий с задачей
 * @param preferred_width ширина div, в котором нужно создать условие задачи. Рекомендуется не использовать это
 * значение, оно было необходимо только для не очень удачно сделанных лабораторий. В любом случае, ширина окна
 * браузера может меняться в процессе работы с лабораторией.
 */
TaskExample.prototype.initialize = function (domNode, kioapi, preferred_width) {
    console.log('preferred width in problem initialization', preferred_width);

    //сохраняем данные для будущего использования
    this.kioapi = kioapi;
    this.domNode = domNode;

    //settings могут иметь произвольные данные для инициализации, например, уровень
    console.log('problem level is', this.settings.level);

    //инициализируем интерфейс
    //инициализируем содержимое задачи в элементе domNode,
    //initInterface - это наш собственный приватный метод
    var $domNode = $(this.domNode);
    this.initInterface($domNode);
};

/**
 * Будем считать, что во всех задачах сравнение решений участников происходит с помощью сравнения значений нескольких параметров.
 * Например, в задаче про 3x + 1 сначала будем сравнивать количество шагов, которые приводят к единице, и будем требовать,
 * чтобы количество шагов было как можно больше. Если количество шагов одинаковое, то смотрим на максимальное число,
 * котороке получается при выполнении шагов. Оно должно быть как можно меньше. Соответственно, есть только два параметра
 * для сравнения:
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
            name: "info1",
            title: "Информационный параметр",
            view: function (v) { //отображаем вещественное число как две точки после запятой, и потом процент
                if (!v) v = 0; //эта функция должна завершаться без ошибок для любых входных данных.
                return v.toFixed(2) + "%";
            },
            normalize: function(v) { //перед сравнением параметра значение превращается в 0
                return 0;
            }
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

/**
 * Статический метод, возвращает manifest для библиотеки preload.js, метод не обязателен.
 * Метод вызывается до создания объекта с задачей.
 * @returns {[*]}
 */
TaskExample.preloadManifest = function() {
    return [
        {id: "1", src: "collatz_conjecture.png"}
    ];
};

/**
 * Возвращает текущее решение в виде объекта, он будет сериализован с помощью JSON.stringify для хранения и передачи по сети
 */
TaskExample.prototype.solution = function () {
    var x = this.process == null ? 0 : this.process.x;
    return {x : x};
};

/**
 * Загрузка решения в задачу. При загрузке решения нужно обновить данные через kioapi.submitResult,
 * в этой примере это делается в обработчике события change()
 * @param solution решение для загрузки
 */
TaskExample.prototype.loadSolution = function (solution) {
    if (!solution || !solution.x)
        return;
    var x = solution.x;

    //проверка, что если при загрузке решения возникает ошибка, то kioapi пересоздаст задачу
    if (x == "error")
        x = x.error.error; //must produce exception

    if (x <= 0 || x >= 1000)
        return;
    this.$input.val('' + x).change();
};

//далее идут приватные методы

//здесь можно воспользоваться шаблонизатором
TaskExample.prototype.initInterface = function ($domNode) {
    var $input_output_container = $("<div class='kio-collatz-input-output-wrapper'>");
    this.$input = $("<input class='number-input' size='3'>");
    this.$output = $("<textarea class='steps-view' readonly='readonly'></textarea>");
    var img = this.kioapi.getResource('1');
    img.className = 'kio-collatz-info-image';

    $domNode.append(img, $input_output_container);
    $input_output_container.append(this.$input, this.$output);

    //add image

    var thisProblem = this;

    this.$input.change(function(evt) {
        var x = +thisProblem.$input.val();
        if (!x || x <= 0 || x >= 1000)
            thisProblem.process = null;
        else
            thisProblem.process = new ThreeXPlusOneProcess(x);

        if (thisProblem.process != null)
            //каждый раз при получении участником результата нужно делать submitResult и передавать объект с результатом
            //проверки.
            thisProblem.kioapi.submitResult({
                steps: thisProblem.process.length(),
                max: thisProblem.process.max(),
                info1: Math.random() // бессмысленный информационный параметр,
                                     // в реальной программе параметры должны быть детерминировны условием
            });
        thisProblem.updateView();
    });

    //загружаем начальное решение. Это то решение, которое увидит участник, впервые открыв задачу
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