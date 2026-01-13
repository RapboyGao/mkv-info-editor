export namespace main {
	
	export class Chapter {
	    time: string;
	    title: string;
	
	    static createFrom(source: any = {}) {
	        return new Chapter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.time = source["time"];
	        this.title = source["title"];
	    }
	}

}

