const fs = require('fs');// this engine requires the fs module
const Path = require('path');
const file = {
    read: (path) => {
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data.toString());
            });
        });
    }
};
const util = {
    /**
              * use sample
    var slideSelectTemplate = '<li id="cgrsNewsCarousselSlide{slideId}" data-target="#cgrsHomeNewsCarousel" data-slide-to="{slideId}" class="list-group-item {active} cgrsNewsCarousselSlide" >{Title}</li>';
    var item = {slideId:1,active:true,Title:'Once Upon a Time'};
    smalSpUtils.interpolate(slideSelectTemplate)(item);
              * @param {string} str 
              */
    interpolate: function mathProperty(str) {
        return function interpolate(o) {
            return str.replace(/{([^{}]*)}/g, function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            });
        }
    },
    /**
           \#([^)]+)\#
            */
    interpolateHash: function mergePartial(str) {
        return function interpolate(o) {
            return str.replace(/\#([^)]+)\#/g, function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            });
        }
    },
    retrieveValueFromPath: function getValue(obj, ptyPath) {
        var pathParts = ptyPath.split('.');
        var d = obj;
        for (var i = 0; i < pathParts.length; i++) {
            var pty = pathParts[i];
            if (pty && d) {
                d = d[pty];
            }
        }
        return d;
    },
    flattenObject: function flattenObject(obj, parent, res = {}) {
        for (let key in obj) {
            let propName = parent ? parent + '.' + key : key;
            if (typeof obj[key] == 'object') {
                flattenObject(obj[key], propName, res);
            } else {
                res[propName] = obj[key];
            }
        }
        return res;
    },
    bind0: function (obj, template) {
        var flatObject = this.flattenObject(obj), res = template;
        for (var pty in flatObject) {
            res = res.replace('#' + pty + "#", flatObject[pty]);
        }
        return this.interpolateHash(template)(flatObject);
    },
    bind: function bindObjectInTemplate(obj, template) {
        if (!template) { return ""; }
        var flatObject = this.flattenObject(obj), res = template;
        for (var pty in flatObject) {
            res = res.replace('#' + pty + "#", flatObject[pty]);
        }
        return res;
    }
};
const tests = {
    utils: {
        retrieveValueFromPath: function () {
            var obj = { "pty1": "TOTO", subs: { pty01: "titi", pty02: "tutu", last: { pty001: "pipi", pty002: "popo" } } };
            var ptyPaths = [
                "pty1", "subs", "subs.pty01", "subs.pty02", "subs.last", "subs.last.pty001", "subs.last.pty002"];
            var ptyPath = "subs.last.pty001";
            if (utils.retrieveValueFromPath(obj, ptyPath) == obj.subs.last.pty001) {
                return true;
            }
            return false;
        },
        bindTes: function () {
            var obj = { index: "<p>Bonjour Paul</p>", login: "<div> Login HERE ! </div>", meta: { title: " page title", description: "page description" } }

            var template = "<title> #meta.title#</title> " + "<description> #meta.description#</description>" +
                " <div> #index#</div>" + " <div> #login#</div>";
            util.bind(obj, template);
        },
        mergePartialTest00: function () {

            function mergePartial(str) {
                return function interpolate(o) {
                    return str.replace(/\#([^)]+)\#/g, function (a, b) {
                        console.log(" pty b is " + b);
                        var r = o[b], t = typeof r;
                        console.log("type of r is  " + t + "; value of r is  " + r);
                        if (t === 'string' || t === 'number') {
                            return r;
                        } else {
                            console.log(" we return a= " + a);
                            return a;
                        }
                    });
                }
            }
            var s = "<div> #index#</div>"; var obj = { index: "<p>Bonjour Paul</p>" }; var res = mergePartial(s)(obj);

            if (res == "<div> <p>Bonjour Paul</p></div>") /**true => COOL */
                console.log("Result OK");
            else
                console.log("Result KO !!");
        },
        mergePartialTest01: function () {

            function bind(obj, template) {

                function mergePartial(str) {
                    return function interpolate(o) {
                        return str.replace(/\#([^)]+)\#/g, function (a, b) {
                            console.log(" pty b is " + b);
                            var r = o[b], t = typeof r;
                            console.log("type of r is  " + t + "; value of r is  " + r);

                            if (t === 'string' || t === 'number') {
                                return r;
                            } else {
                                console.log(" we return a= " + a);
                                return a;
                            }
                        });
                    }
                }
                function flattenObject(ob) {
                    var toReturn = {};
                    for (var i in ob) {
                        if (!ob.hasOwnProperty(i)) continue;
                        if ((typeof ob[i]) == 'object' && ob[i] !== null) {
                            var flatObject = flattenObject(ob[i]);
                            for (var x in flatObject) {
                                if (!flatObject.hasOwnProperty(x)) continue;
                                toReturn[i + '.' + x] = flatObject[x];
                            }
                        } else {
                            toReturn[i] = ob[i];
                        }
                    }
                    return toReturn;
                }

                function flattenObj02(obj, parent, res = {}) {
                    for (let key in obj) {
                        let propName = parent ? parent + '.' + key : key;
                        if (typeof obj[key] == 'object') {
                            flattenObj02(obj[key], propName, res);
                        } else {
                            res[propName] = obj[key];
                        }
                    }
                    return res;
                }
                function test_flattenObject() {
                    flattenObject({ OBJ1: { pty1: "AAA", pty2: 2019 }, OBJ2: { pty1: "BBB", pty2: 1922 } });
                    flattenObject({ OBJ1: { pty1: "AAA", pty2: 2019, OBJ11: { pty1: "AAA", pty2: 2019 } }, OBJ2: { pty1: "BBB", pty2: 1922 } });

                    flattenObj02({ OBJ1: { pty1: "AAA", pty2: 2019 }, OBJ2: { pty1: "BBB", pty2: 1922 } });
                    flattenObj02({ OBJ1: { pty1: "AAA", pty2: 2019, OBJ11: { pty1: "AAA", pty2: 2019 } }, OBJ2: { pty1: "BBB", pty2: 1922 } });

                }
                var flatObject = flattenObject(obj);
                var res = mergePartial(template)(flatObject);
            }


            var obj = {
                index: "<p>Bonjour Paul</p>", login: "<div> Login HERE ! </div>",
                meta: { title: " page title", description: "page description" }
            }

            var s = "<title> #meta.title#</title> " +
                "<description> #meta.description#</description>" +
                " <div> #index#</div>"
                + " <div> #login#</div>"

            var res = bind(s, obj);

            console.log(res);


        }
        /*
const target = { a: 1, b: 2 };
const source = { b: 4, c: 5 };
const returnedTarget = Object.assign(target, source);

        */
    }
};
/**
 * class that define a partial html document that must be included in another Partial
 */
class Component {
    constructor(name, htmlPath, localData = {}, components) {
        if (!name) {
            throw "name of the component must be defined to be used in parent component";
        }
        if (!htmlPath) {
            throw "path of the component must be defined to be used in parent component";
        }
        htmlPath = htmlPath || "";
        this.path = htmlPath || "";

        if (__dirname) {
            // var pathParts = path.split("/");
            // var fileName = pathParts[pathParts.length - 1];
            if (htmlPath.indexOf(__dirname) != 0) {
                this.path = Path.resolve(__dirname, htmlPath);
            }
        }
        this.name = name;
        this.localData = localData || {};
        this.components = [];
        this.html = null;
        if (components) {
            if ((components instanceof Component)) {
                if (!components.path) {
                    throw "Component without path";
                }
                this.components = [components];
            }
            if (Array.isArray(components)) {
                this.components = components;
                components.forEach(comp => {
                    if (!comp.path) {
                        throw "Component without path";
                    }
                });
            }
        }
    }
    /**
     * return an array of promise
     */
    Prepare() {
        var promises4SubCompLoad = [];
        /*first we load sub templates */
        if (this.components) {
            for (var compName in this.components) {
                var comp = this.components[compName];
                promises4SubCompLoad.concat(comp.Prepare());
            }
        }
        /*read the html file */
        console.debug("loading html for " + this.name);
        var promX = file.read(this.path).then(html => {
            this.html = (html || "").replace(/\n/g, "").replace(/\r/g, "");
            console.log(this.name + " Html has been loaded");
            return this.html;
        });
        promises4SubCompLoad.push(promX);
        return promises4SubCompLoad;
        // return Promise.all(promises4SubCompLoad);
    }
    Bind() {
        for (var i in this.components) {
            this.localData["Component." + this.components[i].name] = this.components[i].html;
        }
        var html = util.bind(this.localData, this.html);
        this.html = html;
    }
    Dispose() {
        this.html = null;
        // delete this;
    }
}
/**
 * class to define a top level template-or layout- that can use nested template
 */
class WebPage extends Component {
    /**
     * 
     * @param {string} name 
     * @param {string} path 
     * @param {object} meta 
     * @param {object} localData 
     * @param {Template,TemplateDictionary} components 
     */
    constructor(name, path, meta, localData, components) {
        super(name, path, localData, components);
        this.meta = meta;

        if (!this.localData.title) {
            this.localData.title = this.name;
        }
    }
    static DefaultData() {
        return {
            title: "",
            description: "",
            absoluteUrl: ""
        };
    }
    Build() {
        /*first we load child components */
        var promises = this.Prepare();
        return Promise.all(promises).then(x => {
            for (var i in this.components) {
                this.components[i].Bind();
                this.localData["Component." + this.components[i].name] = this.components[i].html;
            }
            this.Bind();
            return this.html;
        });
    }
}
/*sample code from
https://expressjs.com/en/advanced/developing-template-engines.html
 */
const sampleRenderEngine = function (filePath, options, callback) { // define the template engine
    fs.readFile(filePath,
        function (err, content) {
            if (err) return callback(err);

            // this is an extremely simple template engine
            var rendered = content.toString()
                .replace('#title#', '<title>' + options.title + '</title>')
                .replace('#message#', '<h1>' + options.message + '</h1>')
            return callback(null, rendered)
        })
};
function renderFile(path, options, callback) {
    /*define path template using class defined */
    /* page is home.html it contains
     custom meta headers,
     string value to match like user name, session token;
     it contains also nested path to templates to insert into: login, homeBodyContent
     */
    var webPage = options;
    webPage.Build().then(promises => {
        if (callback) return callback(null, webPage.html)
        else return webPage.html;
    }).catch(err => {
        console.error(err);
        if (callback)
            return callback(err);
    });
}
function getSamplePage(path = '/home', options = new WebPage("home", "home.html",
    { "og:site_name": "Fratelo", "og:type": "website" },
    {
        title: "Fratelo is your toolbox for freelancing",
        updated: "2019-07-15", token: "afeab-231e"
    },
    [
        new Component("topMenu", "_topMenu.html"),
        new Component("login", "_login.html", { username: "Pascal Martin" }),
        new Component("bodyContent", "_homeBodyContent.html")
    ])) {
    /*define path template using class defined */
    /* page is home.html it contains
     custom meta headers,
     string value to match like user name, session token;
     it contains also nested path to templates to insert into: login, homeBodyContent
     */
    var webPage = options;

    webPage.Build().then(promises => {
        if (callback) return callback(null, webPage.html)
        else return webPage.html;
    }).catch(err => {
        console.error(err);
        if (callback)
            return callback(err);
    });

}
module.exports = {
    getSamplePage: getSamplePage,
    Component: Component,
    WebPage: WebPage
}/**
for render engine check express.engine:

C:\Users\every\AppData\Local\Microsoft\TypeScript\3.5\node_modules\@types\express-serve-static-core\index.d.ts

app.engine('html', require('ejs').renderFile);
*/