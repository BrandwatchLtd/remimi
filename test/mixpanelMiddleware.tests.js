import assert from 'assert';
import mixpanel from 'mixpanel-browser';
import mixpanelMiddleware from '../src/';
import sinon from 'sinon';

describe('mixpanelMiddleware', () => {
    let sandbox;
    const mockToken = 'TOKEN';

    const selectors = {
        getPerson(state) {
            const {
                auth: {
                    user: {
                        username,
                        firstName,
                        lastName,
                        client: {
                            id: clientId,
                            name: clientName,
                        } = {},
                    } = {},
                },
            } = state;

            return {
                clientId: clientId,
                clientName: clientName,
                $first_name: firstName,
                $last_name: lastName,
                $email: username,
            };
        },

        getUniqueId(state) {
            const {
                auth: {
                    user: {
                        id,
                    } = {},
                },
            } = state;

            return id;
        }
    };

    const nonMixpanelAction = {
        type: 'Action',
    };

    const nonMixpanelActionWithMeta = {
        type: 'Action',
        meta: {
            foo: 'bar',
        },
    };

    const mixpanelActionWithoutProps = {
        type: 'Action',
        meta: {
            mixpanel: {
                eventName: 'fooEvent',
            },
        },
    };

    const mixpanelActionWithProps = {
        type: 'Action',
        meta: {
            mixpanel: {
                eventName: 'fooEvent',
                props: {
                    foo: 'bar',
                },
            },
        },
    };

    const mixpanelActionWithIncrementArray = {
        type: 'Action',
        meta: {
            mixpanel: {
                eventName: 'fooEvent',
                props: {
                    foo: 'bar',
                },
                increment: ['login', 1],
            },
        },
    };

    const mixpanelActionWithIncrementObject = {
        type: 'Action',
        meta: {
            mixpanel: {
                eventName: 'fooEvent',
                props: {
                    foo: 'bar',
                },
                increment: {
                    login: 1,
                    logout: -1,
                }
            },
        },
    };

    const mixpanelActionWithIncrementString = {
        type: 'Action',
        meta: {
            mixpanel: {
                eventName: 'fooEvent',
                props: {
                    foo: 'bar',
                },
                increment: 'login',
            },
        },
    };

    const mixpanelActionWithTimeEvent = {
        type: 'Action',
        meta: {
            mixpanel: {
                eventName: 'fooEvent',
                timeEvent: 'barEvent',
                props: {
                    foo: 'bar',
                },
            },
        },
    };

    const mixpanelActionWithTypeOverride = {
        type: 'Action',
        meta: {
            mixpanel: {
                type: 'Better Action',
                eventName: 'fooEvent',
            },
        },
    };

    const mockUser = {
        id: '1234',
        username: 'foo@bar.com',
        firtName: 'Foo',
        lastName: 'Bar',
        client: {
            id: '5678',
            name: 'foo',
        },
    };

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(mixpanel, 'init');
        sandbox.stub(mixpanel, 'track');
        sandbox.stub(mixpanel, 'time_event');
        sandbox.stub(mixpanel, 'identify');

        // Mixpanel doesn't add the people object until it has initiated.
        mixpanel.people = {
            set: sandbox.stub(),
            increment: sandbox.stub(),
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('initialises with the given token', () => {
        mixpanelMiddleware(mockToken);
        assert(mixpanel.init.calledOnce);
        assert(mixpanel.init.calledWith(mockToken));
    });

    it('initialises with the given config', () => {
        const config = {
            autotrack: false
        };

        mixpanelMiddleware(mockToken, { config });

        assert(mixpanel.init.calledOnce);
        assert(mixpanel.init.calledWith(mockToken));
    });

    const store = {auth: {}};
    let nextStub;
    let middleware;

    function runMiddleware(action, middlewareOptions) {
        nextStub = sandbox.stub();
        middleware = mixpanelMiddleware(mockToken, {
            personSelector: selectors.getPerson,
            uniqueIdSelector: selectors.getUniqueId, ...middlewareOptions
        });
        middleware({getState: () => store})(nextStub)(action);
        assert(nextStub.calledOnce);
        assert(nextStub.calledWith(action));
    }

    describe('middleware function', () => {

        it('does not attempt to track an action with no meta', () => {
            runMiddleware(nonMixpanelAction);
            assert(mixpanel.track.notCalled);
        });

        it('does not attempt to track an action with no mixpanel meta', () => {
            runMiddleware(nonMixpanelActionWithMeta);
            assert(mixpanel.track.notCalled);
        });

        it('tracks a mixpanel event with the given event name', () => {
            runMiddleware(mixpanelActionWithoutProps);
            assert(mixpanel.track.calledOnce);
            assert.equal(mixpanel.track.firstCall.args[0], mixpanelActionWithoutProps.meta.mixpanel.eventName);
        });

        it('tracks a mixpanel event with the action name as action property', () => {
            runMiddleware(mixpanelActionWithoutProps);
            assert(mixpanel.track.calledOnce);
            assert.equal(mixpanel.track.firstCall.args[1].action, mixpanelActionWithoutProps.type);
        });

        it('tracks an action with a mixpanel event with props', () => {
            runMiddleware(mixpanelActionWithProps);
            assert(mixpanel.track.calledOnce);
            assert.equal(mixpanel.track.firstCall.args[1].foo, mixpanelActionWithProps.meta.mixpanel.props.foo);
        });

        it('tracks an action with action type override', () => {
            runMiddleware(mixpanelActionWithTypeOverride);
            assert(mixpanel.track.calledOnce);
            assert.equal(mixpanel.track.firstCall.args[1].action, 'Better Action');
        });

        describe('tracks an increment event with the provided values ', () => {
            it('array', () => {
                runMiddleware(mixpanelActionWithIncrementArray);
                assert(mixpanel.people.increment.calledOnce);
                assert(mixpanel.people.increment.calledWith(...mixpanelActionWithIncrementArray.meta.mixpanel.increment));
            });

            it('object', () => {
                runMiddleware(mixpanelActionWithIncrementObject);
                assert(mixpanel.people.increment.calledOnce);
                assert(mixpanel.people.increment.calledWith(mixpanelActionWithIncrementObject.meta.mixpanel.increment));
            });

            it('object', () => {
                runMiddleware(mixpanelActionWithIncrementString);
                assert(mixpanel.people.increment.calledOnce);
                assert(mixpanel.people.increment.calledWith(mixpanelActionWithIncrementString.meta.mixpanel.increment));
            });
        });

        it('tracks timed event with the provided event name ', () => {
            runMiddleware(mixpanelActionWithTimeEvent);
            assert(mixpanel.time_event.calledOnce);
            assert(mixpanel.time_event.calledWith(mixpanelActionWithTimeEvent.meta.mixpanel.timeEvent));
        });

        describe('with user data', () => {
            beforeEach(() => {
                store.auth.user = mockUser;
            });

            it('adds user data to the request', () => {
                runMiddleware(mixpanelActionWithProps);

                assert.equal(mixpanel.identify.args[0][0], mockUser.id);
                assert(mixpanel.people.set.calledWith({
                    clientId: mockUser.client.id,
                    clientName: mockUser.client.name,
                    $first_name: mockUser.firstName,
                    $last_name: mockUser.lastName,
                    $email: mockUser.username,
                }));
            });
        });
    });

    describe('middleware formatters', function() {
        describe('action type', function() {
            it('uses default identity formatter', function() {
                runMiddleware(mixpanelActionWithProps);
                assert.equal(mixpanel.track.firstCall.args[0], 'fooEvent');
            });

            it('formats the event type', function() {
                runMiddleware(mixpanelActionWithProps, {actionTypeFormatter: value => `---${value}---`});
                assert.equal(mixpanel.track.firstCall.args[0], '---fooEvent---');
            });
        });

        describe('properties', function() {
            it('uses default identity formatter', function() {
                runMiddleware(mixpanelActionWithProps);
                assert.equal(mixpanel.track.firstCall.args[1].foo, 'bar');
            });

            it('formats all properties of payload', function() {
                runMiddleware(mixpanelActionWithProps, {propertyFormatter: value => `===${value}===`});
                assert.equal(mixpanel.track.firstCall.args[1]['===foo==='], 'bar');
            });

            it('formats all values of payload', function() {
                runMiddleware(mixpanelActionWithProps, {valueFormatter: value => `===${value}===`});
                assert.equal(mixpanel.track.firstCall.args[1]['foo'], '===bar===');
            });

            it('formats all properties and values of payload', function() {
                runMiddleware(mixpanelActionWithProps, {
                    propertyFormatter: value => `===${value}===`,
                    valueFormatter: value => `===${value}===`
                });

                assert.equal(mixpanel.track.firstCall.args[1]['===foo==='], '===bar===');
            });

            describe('formats the increment name', function() {
                it('array', () => {
                    runMiddleware(mixpanelActionWithIncrementArray, {propertyFormatter: value => `===${value}===`});
                    assert(mixpanel.people.increment.calledOnce);
                    assert(mixpanel.people.increment.calledWith('===login===', 1));
                });

                it('object', () => {
                    runMiddleware(mixpanelActionWithIncrementObject, {propertyFormatter: value => `===${value}===`});
                    assert(mixpanel.people.increment.calledOnce);
                    assert(mixpanel.people.increment.calledWith({
                        '===login===': 1,
                        '===logout===': -1,
                    }));
                });

                it('string', () => {
                    runMiddleware(mixpanelActionWithIncrementString, {propertyFormatter: value => `===${value}===`});
                    assert(mixpanel.people.increment.calledOnce);
                    assert(mixpanel.people.increment.calledWith('===login==='));
                });
            });
        });
    });
});
