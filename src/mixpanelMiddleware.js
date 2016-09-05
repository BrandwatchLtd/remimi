import mixpanel from 'mixpanel-browser';

const identity = value => value;

const renameProperties = (object, formatter) => {
    return Object.keys(object).reduce((memo, key) => {
        memo[formatter(key)] = object[key];
        return memo;
    }, {})
};

export default function mixpanelMiddleware(token, { personSelector, uniqueIdSelector, actionTypeFormatter = identity, propertyFormatter = identity} = {}) {
    mixpanel.init(token);

    return store => next => action => {
        const {
            type,
            meta: {
                mixpanel: mixpanelPayload,
                mixpanelIncrement: increment,
            } = {},
        } = action;

        if (mixpanelPayload) {
            if (personSelector && uniqueIdSelector) {
                const person = personSelector(store.getState());
                mixpanel.identify(uniqueIdSelector(store.getState()));
                mixpanel.people.set(person);
            }

            const data = (typeof mixpanelPayload === 'object') ? mixpanelPayload : {};

            mixpanel.track(actionTypeFormatter(type), {
                ...renameProperties(data, propertyFormatter),
            });
        }

        if (increment && increment.length > 0) {
            mixpanel.people.increment(propertyFormatter(increment));
        }

        return next(action);
    };
}