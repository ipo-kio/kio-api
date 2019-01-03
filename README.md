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
    
    В Google Chrome из соображений безопасности могут быть
    запрещены загрузки изображений по протоколу
    file://, поэтому напрямую посмотреть в нем HTML файл
    может не получиться. Нужно либо пользоваться Firefox, либо
    запускать HTML через HTTP сервер. Встроенный сервер
    для этой цели есть в IntelliJ IDEA (Web Storm)