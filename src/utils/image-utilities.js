const Module = require('module');
const fs = require('fs');

Module._extensions['.png'] = function (module, fn) {
    var base64 = fs.readFileSync(fn).toString('base64');
    module._compile('module.exports="data:image/png;base64,' + base64 + '"', fn);
};

Module._extensions['.jpg'] = function (module, fn) {
    var base64 = fs.readFileSync(fn).toString('base64');
    module._compile('module.exports="data:image/jpg;base64,' + base64 + '"', fn);
};

const anl = require("../../resources/logos/logo-anl.jpg");
const cma = require("../../resources/logos/logo-cmacgn.jpg");
const apl = require("../../resources/logos/logo-apl.jpg");
const cnc = require("../../resources/logos/logo-cnc.jpg");
const evg = require("../../resources/logos/logo-evg.jpg");
const cos = require("../../resources/logos/logo-cos.jpg");
const esl = require("../../resources/logos/logo-esl.jpg");
const gsl = require("../../resources/logos/logo-gsl.jpg");
const hmm = require("../../resources/logos/logo-hmm.jpg");
const hll = require("../../resources/logos/logo-hll.jpg");
const hsd = require("../../resources/logos/logo-hsd.jpg");
const kmt = require("../../resources/logos/logo-kmt.jpg");
const mat = require("../../resources/logos/logo-mat.jpg");
const mcc = require("../../resources/logos/logo-sealand.jpg");
const msc = require("../../resources/logos/logo-msc.jpg");
const msk = "";// require("../../resources/logos/logo-msk.png");
const one = require("../../resources/logos/logo-one.jpg");
const pil = require("../../resources/logos/logo-pil.jpg");
const rcl = require("../../resources/logos/logo-rcl.png");
const saf = require("../../resources/logos/logo-saf.jpg");
const skr = require("../../resources/logos/logo-skr.png");
const sml = require("../../resources/logos/logo-sml.jpg");
const stc = require("../../resources/logos/logo-stc.png");
const tsl = require("../../resources/logos/logo-tsl.jpg");
const whl = require("../../resources/logos/logo-whl.jpg");
const yml = require("../../resources/logos/logo-yng.jpg");
const zim = require("../../resources/logos/logo-zim.jpg");
const oocl = require("../../resources/logos/logo-oocl.jpg");
const transfer = require("../../resources/logos/logo-transfer.png");
const allseas = require("../../resources/logos/logo-allseas.jpg");
const culines = require("../../resources/logos/logo-culines.jpg");
const sealand = require("../../resources/logos/logo-sealand.jpg");
const rclnew = require("../../resources/logos/logo-newrcl.png");

const getCarrierLogo = (carrier) => {
    const carrierForComparison = carrier?.toLowerCase();
    switch (carrierForComparison) {
        case "cma":
        case "cmdu":
            return cma;
        case "anl":
        case "annu":
            return anl;
        case "apl":
        case "aplu":
            return apl;
        case "cnc":
        case "11dx":
            return cnc;
        case "cos":
        case "cosu":
            return cos;
        case "evg":
        case "eglv":
            return evg;
        case "esl":
        case "espu":
            return esl;
        case "gsl":
        case "gslu":
            return gsl;
        case "hmm":
        case "hdmu":
            return hmm;
        case "hll":
        case "hlcu":
            return hll;
        case "hsd":
        case "sudu":
            return hsd;
        case "kmt":
        case "kmtu":
        case "kmtc":
            return kmt;
        case "mat":
        case "mats":
            return mat;
        case "mcc":
        case "mccq":
            return mcc;
        case "msc":
        case "mscu":
            return msc;
        case "msk":
        case "maeu":
            return msk;
        case "one":
        case "oney":
            return one;
        case "pil":
        case "pciu":
            return pil;
        case "saf":
        case "safm":
            return saf;
        case "skr":
            return skr;
        case "sml":
        case "smlm":
            return sml;
        case "stc":
            return stc;
        case "tsl":
        case "13df":
            return tsl;
        case "whl":
        case "22aa":
            return whl;
        case "yml":
        case "ymlu":
            return yml;
        case "zim":
        case "zimu":
            return zim;
        case "oocl":
        case "oolu":
        case "ool":
            return oocl;
        case "transfer":
            return transfer;
        case "cul":
        case "culu":
        case "cu line":
            return culines;
        case "als":
        case "ausa":
            return allseas;
        case "rcl":
        case "regu":
        case "rclu":
            return rclnew;
    }
};


module.exports = {
    getCarrierLogo
}