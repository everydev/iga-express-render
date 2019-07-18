const fs = require('fs');// this engine requires the fs module
// const Path = require('path');
// const express = require('express'), app = express();
module.exports = {};

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
    interpolateHash: function mergePartial(str) {
        return function interpolate(o) {
            return str.replace(/\#([^)]+)\#/g, function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            });
        }
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
    bind: function bindObjectInTemplate(obj, template) {
        if (!template) { return ""; }
        var flatObject = this.flattenObject(obj), res = template;
        for (var pty in flatObject) {
            res = res.replace('#' + pty + "#", flatObject[pty]);
        }
        return res;
    }
};
const Builder = {
    Interpolate: (obj, template) => {
        if (!template || !obj) { return template; }
        // var flatObject = this.flattenObject(obj), res = template;
        for (var pty in obj) {
            template = template.replace('#' + pty + "#", obj[pty]);
        }
        return template;
    },
    FlattenObject: (obj, parent, res = {}) => {
        for (let key in obj) {
            let propName = parent ? parent + '.' + key : key;
            if (typeof obj[key] == 'object') {
                Builder.FlattenObject(obj[key], propName, res);
            } else {
                res[propName] = obj[key];
            }
        }
        return res;
    },
    /**Here we are preparing the html content files, we return an array of promises */
    Prepare: (def) => {
        var promises4SubCompLoad = [];
        /*first we load sub templates */
        if (def.components) {
            def.components.forEach(comp => {
                promises4SubCompLoad.concat(Builder.Prepare(comp));
            })
        }
        /*read the html file */
        console.debug("loading html for " + def.name);
        var promX = file.read(def.htmlPath).then(html => {
            def.html = (html || "").replace(/\r\n/g, "");//.replace(/\r/g, "");
            console.log(def.name + " Html has been loaded");
            return def.html;
        });
        promises4SubCompLoad.push(promX);
        return promises4SubCompLoad;
        // return Promise.all(promises4SubCompLoad);
    },
    Bind: (def) => {
        /**first we reduce nested object */
        if (def.localData) {
            def.localData = Builder.FlattenObject(def.localData);
        }
        if (def.components) {
            /*if there are components we have to bind their content to the parent to inject the html */
            def.components.forEach((comp, index, array) => {
                let compHtml = Builder.Bind(comp);
                def.html = def.html.replace('#' + "Component." + comp.name + "#", compHtml);
                // def.localData["Component." + comp.name] = compHtml;
            });
        }
        def.html = Builder.Interpolate(def.localData, def.html);
        return def.html;
    },
    Build: (def) => {
        /*first we load child components */
        var promises = Builder.Prepare(def);
        return Promise.all(promises).then(x => {
            /* we are sure now all html file content have been loaded */
            Builder.Bind(def); // def.Bind();
            return def.html;
        });
    }
};
/**
 * class that define a partial html document that must be included in another Partial
 */
class Component {
    constructor(name, htmlPath, localData, components) {
        if (!name) {
            throw "name of the component must be defined to be used in parent component";
        }
        if (!htmlPath) {
            throw "htmlPath property of the component must be defined to be used in parent component";
        }
        this.name = name;
        this.htmlPath = htmlPath;
        this.html = "";
        this.components = [];
        if (!components && localData) {
            /*we check if local data is Component*/
            if (localData instanceof Component) {
                components = [localData];
            } else {
                if (Array.isArray(localData)) {
                    components = localData;
                }
            }
        }

        this.localData = localData || {};
        if (components) {
            if (!Array.isArray(components)) { components = [components]; } else {
                this.components = components;
                components.forEach((comp, index, array) => {
                    if (false == (comp instanceof Component)) {
                        array[index] = new Component(comp.name, comp.htmlPath, comp.localData);
                    }
                });
            }
        }
    }
};
module.exports.Component = Component;
/**
 * class to define a top level template-or layout- that can use nested template
 */
class WebPage extends Component {
    /**
     *
     * @param {string} name
     * @param {string} htmlPath
     * @param {object} meta
     * @param {object} localData
     * @param {Template,TemplateDictionary} components
     */
    constructor(name, htmlPath, meta, localData, components) {
        super(name, htmlPath, localData, components);
        this.meta = meta;

        if (!this.localData.title) {
            this.localData.title = this.name;
        }
        /*properties filled by express */
        this.settings = { 'view engine': 'html', views: null };
        /* this.settings['view engine'] contains file extension to consider, then we can build file extension like this
        const ext = '.' + settings['view engine']; */
        /* app.set('views', './server/views'); will set settings.views */
    }
};
module.exports.WebPage = WebPage;
/**
for render engine check express.engine:
AppData\Local\Microsoft\TypeScript\3.5\node_modules\@types\express-serve-static-core\index.d.ts
app.engine('html', require('ejs').renderFile);
*/
module.exports.renderFile = (htmlAbsolutePath, options, callback) => {
    console.debug("Rendering " + htmlAbsolutePath);
    // console.debug("options = ", options);   
    Builder.ViewFolder = options.views;
    var webPage = options;
    // var webPage = ComponentUpgrade(options);
    // webPage.Build = WebPageBuild.bind(webPage);
    // promBuild= webPage.Build();
    var promBuild = Builder.Build(webPage);
    promBuild.then(promises => {
        console.debug("All page components are assembled.")
        if (callback) {
            return callback(null, webPage.html);
        }
        else {
            return webPage.html;
        }
    }).catch(err => {
        console.error(err);
        if (callback) {
            return callback(err);
        }
    });
};