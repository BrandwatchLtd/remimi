'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = mixpanelMiddleware;

var _mixpanelBrowser = require('mixpanel-browser');

var _mixpanelBrowser2 = _interopRequireDefault(_mixpanelBrowser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function mixpanelMiddleware(token, getPerson, getUniqueId) {
    _mixpanelBrowser2.default.init(token);

    return function (store) {
        return function (next) {
            return function (action) {
                var type = action.type;
                var _action$meta = action.meta;
                _action$meta = _action$meta === undefined ? {} : _action$meta;
                var data = _action$meta.mixpanel;
                var increment = _action$meta.mixpanelIncrement;


                if (data) {
                    if (getPerson && getUniqueId) {
                        var person = getPerson(store.getState());
                        _mixpanelBrowser2.default.identify(getUniqueId(store.getState()));
                        _mixpanelBrowser2.default.people.set(person);
                    }

                    _mixpanelBrowser2.default.track(type, _extends({}, (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' ? data : {}));
                }

                if (increment && increment.length > 0) {
                    _mixpanelBrowser2.default.people.increment(increment);
                }

                return next(action);
            };
        };
    };
}