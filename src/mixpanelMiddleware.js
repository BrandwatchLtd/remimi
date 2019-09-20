const mixpanel = require('mixpanel-browser');

const identity = value => value;

const renameEventData = (object, propFormatter, valFormatter) => {
    return Object.keys(object).reduce((memo, key) => {
        memo[propFormatter(key)] = valFormatter(object[key]);
        return memo;
    }, {})
};

module.exports = function mixpanelMiddleware(token, options = {}) {
    mixpanel.init(token, options.config);

    const {
        personSelector,
        uniqueIdSelector,
        actionTypeFormatter = identity,
        propertyFormatter = identity,
        valueFormatter = identity,
    } = options;

    return store => next => action => {
        const {
            type,
            meta: {
                mixpanel: {
                    type: customType,
                    eventName: eventName,
                    timeEvent: timeEvent,
                    props: mixpanelPayload,
                    increment: increment,
                } = {},
            } = {},
        } = action;

        let result = next(action);

        if (eventName) {
            if (personSelector && uniqueIdSelector) {
                const person = personSelector(store.getState());
                mixpanel.identify(uniqueIdSelector(store.getState()));
                mixpanel.people.set(person);
            }

            const data = (typeof mixpanelPayload === 'object') ? mixpanelPayload : {};
            mixpanel.track(actionTypeFormatter(eventName), {
                ...renameEventData(data, propertyFormatter, valueFormatter),
                action: actionTypeFormatter(customType || type),
            });
        }

        if (timeEvent) {
            mixpanel.time_event(actionTypeFormatter(timeEvent));
        }

        if (Array.isArray(increment)) {
            mixpanel.people.increment(propertyFormatter(increment[0]), increment[1]);
        } else if (increment === Object(increment)) {
            mixpanel.people.increment(Object.keys(increment).reduce((inc, key) => ({ ...inc,
                [propertyFormatter(key)]: increment[key],
            }), {}));
        } else if (increment) {
            mixpanel.people.increment(propertyFormatter(increment));
        }

        return result;
    };
}
