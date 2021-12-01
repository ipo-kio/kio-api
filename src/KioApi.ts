export interface KioApi {
    submitResult(result: {}): void;
    getResource(id: string): HTMLElement; //TODO is it always an html element?
    problem: { message(msg: string): string;}
}

export interface KioTaskSettings {
    level: string
}

export interface KioResourceDescription {
    id: string,
    src: string
}

export interface KioParameterDescription {
    name: string,
    title: string,
    ordering: 'maximize' | 'minimize',
    view?(v:number):string,
    normalize?(v:number):number
}
