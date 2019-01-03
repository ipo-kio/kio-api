# Kio development with JS

## Provides
* Kio API library to use from tasks
* Testing environment to debug kio tasks
* A task example (Collatz conjecture)

## Компиляция и запуск

1. Установить пакеты: `npm install`
1. Компилировать для production: `npm run comple-prod` или
   компировать отладочную версию: `npm run compile`
1. Запуск webpack в режиме для разработки. В этом режиме
   компиляция запускается при любом изменении исходных
   файлов: `npm run watch`
1. Для просмотра примера задачи запустите
    `kio_test_box/index.html` (исходники в
    `src/task_example`).
    
   Иногда при работе по протоколу file:// могут в некоторых
   браузерах возникать проблемы с выполнением CORS запросов.
   В этом случае задача не загружается, а в консоли пишется
   ошибка про запрет CORS запроса.
   Нужно либо попробовать поменять браузер, либо
   запускать HTML через HTTP сервер. В IntelliJ IDEA
   (Web Storm) есть встроенный HTTP сервер для подобных
   целей.