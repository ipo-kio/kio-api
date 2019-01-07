# Kio development with JS

## В этом репозитории
* Реализация КИО API для системы проведения соревнований DCES2
* Заглушка системы проведения соревнований DCES2 (файл `dces2contest.js`), которая
хранит всю информацию о решениях задач в localstorage, и требует сервера.
* Пример реализации задачи КИО на основе КИО API. (Collatz conjecture, гипотеза Коллаца)

## Компиляция и запуск

1. Установить пакеты: `npm install`
1. Компилировать для production: `npm run comple-prod` или
   компировать отладочную версию: `npm run compile`
1. Запуск webpack в режиме для разработки. В этом режиме
   компиляция запускается при любом изменении исходных
   файлов: `npm run watch`
1. Для просмотра примера задачи запустите компиляцию, и после этого откройте файл
    `kio_test_box/index.html` в браузере.
    
   Иногда при работе по протоколу file:// в некоторых 
   браузерах
   могут возникать проблемы с выполнением CORS запросов.
   В этом случае задача не загружается, а в консоли пишется
   ошибка про запрет CORS запроса.                                                                                                                                                                                                                                                                                                                                                                                                  
   Нужно либо попробовать поменять браузер, либо
   запускать HTML через HTTP сервер. В IntelliJ IDEA
   (Web Storm) есть встроенный HTTP сервер для подобных
   целей.
   
## Устройство задач КИО

Основная составляющая задачи конкурса КИО — это лаборатория, которая позволяет участнику
подбирать решения задачи. Участник пробует разные решения, анализирует и улучшает их.

Задача КИО имеет определенные в условии критерии оценки решения. На экране постоянно отображается
оценка текущего решения участника. Кроме того,
отображается оценка для лучшего решения, которое когда-либо было получено.

[Требования к задачам конкурса КИО](https://docs.google.com/document/d/1qd5V-Zc8sIM0DOOHGjDxrJGfDWgKMnIa2gwoolcE__4/edit?usp=sharing).

## Пример задачи о гипотезе Коллаца

Процесс "3x+1" устроен так. Он начинается с натурального числа, если оно четное,
его надо поделить на два. Если нечетное, то x -> 3x + 1. Для всех чисел от 1 до 999
этот процесс рано или поздно приводит к 1. Нужно придумать начальное число от 1 до 999 так,
чтобы количество шагов было как можно больше, при этом, чтобы максимальное число, полученное
в процессе, было как можно меньше. Т.е. участник использует лабораторию, чтобы ввести
одно число, а лаборатория оценивает два критерия: количество шагов перед приходом к единице
и максимальное число, которое при этом получается. Значение по первому критерию должно быть
как можно больше, по второму — как можно меньше.

Эта задача не очень хорошо подходит для конкурса, потому что ее слишком легко решать. Но она
хорошо демонстрирует работу с КИО API.

## Устройство КИО API

Лаборатория общается с системой проведения соревнований через КИО API. Ответственность лаборатории
состоит только в том, чтобы предоставлять системе проведения соревнований все решения, которые
предлагает участник. Лаборатория не сравнивает решения, не отсылает их на сервер.

Все примеры использования КИО API есть в примере про задачу Коллаца в файле
`src/task_example/task_example.js`.

Лаборатория отвечает только за отображение трех компонентов вверху экрана: поле ввода числа,
текст с информацией о процессе преобразования числа, картинка с комиксом. Остальные компоненты,
включая информацию о значениях параметров и кнопки загрузки и сохранения решения, отображаются
реализацией KIO API. 

### Допустимые вызовы от лаборатории к КИО API:

1. Инициализация. `kio_api.initializeKioProblem` В этом примере она происходит в файле
`index.html`. Для инициализации нужно указать класс
(javascript конструктор класса), который реализует задачу, DOM элемент, в котором
нужно сформировать интерфейс лаборатории и набор настроек задачи. Например, в задаче на
поиск оптимального пути в набор настроек может входить граф дорог. На практике, в большинстве
случаев настройка содержит только номер уровня, один из трех: версия для младших классов, 
для средних, для старших классов.
1. Запрос ресурсов. `kio_api.getResource` Если в лаборатории нужны картинки, их нужно
запрашивать у КИО API, чтобы самостоятельно не разбираться с загрузкой ресурсов.
1. Отсылка решения участника. `kio_api.submitResult` Как только участник предлагает любое новое
решение, необходимоо сразу отослать его с помощью этого метода. А точнее, отослать нужно
не решение, а результат его оценки по набору критериев.
1. В прошлых версиях API еще можно было получить ресурсы в зависимости от языка. Но пока
конкурс перестал проводиться за границей, и необходимость временно отпала.

### Допустимые вызовы от КИО API к лаборатории:

Лаборатория реализуется в виде javascript класса, который имеет определенные
методы (реализует интерфейс). Эти методы вызываются из API, т.е. используется обратный вызов.

1`id` — строковый идентификатор заздачи
1 `initialize` — инициализация задачи, она происходит уже после того, как загрузились все
необходимые ресуры.
1. `parameters` — возвращает набор критериев (параметров) оценки решения. Эти
параметры лаборатория оценивает для каждого решения. А вот сравнение решений 
на основе этих параметров совершается уже без участия лаборатории. Лаборатория только
описывает, как производить сравнение.

    Параметры возвращаются в массиве, сравнивать решения нужно сначала по первому параметру,
    и если значения совпали, то сравнивать надо по второму параметру. Если совпали по второму —
    сравнивать надо по третьему и т.д.
    
    Для каждого параметра указывается, как его отображать, см. примеры. Для параметра еще
    можно указать функцию `normalize`. Она необходима для сложных ситуаций сравнения. Например,
    если сравнивать нужно вещественные числа только по первым двум значащим цифрам, в методе
    `normalize` можно отбросить остальные цифры. Другой вариант использования — превращать
    любое значение в 0, в этом случае любые сравнения параметров при сравнении становятся
    одинаковыми. Это изредка нужно для введения "информационных" параметров, т.е. параметров,
    которые нужно показывать участнику, но которые не должны влиять на сравнение решений.
1. `preloadManifest` — возвращает манифест с информацией о загрузке ресурсов для
использования библиотекой [`preloadjs`](https://www.createjs.com/docs/preloadjs/modules/PreloadJS.html).
1. `solution` — возвращает текущее решение участника в виде js объекта. Это решение
сериализуется через `JSON.stringify` и сохраняется или отсылается по сети.
1. `loadSolution` — загрузить указанный объект как решение. Ожидается, что этот объект был
ранее создан вызовом функции `solution`, но реализация должна быть устойчива к любым
ошибкам внутри объекта. 