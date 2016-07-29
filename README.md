# redux-mixpanel-middleware

Advanced Client Redux Mixpanel Middleware. 

# Installation

`npm install --save git+ssh@github.com:BrandwatchLtd/redux-mixpanel-middleware.git`

# Basic Configuration

```js
import { createStore } from 'redux';
import mixpanelMiddleware from 'redux-mixpanel-middleware';

import reducer from './your-reducers';

let store = createStore(reducer, ['Initial State'], mixpanelMiddleware(token));
```

This is very basic usage. You want to setup the Profiles for application in production.

# Advanced configuration - Profile

> Mixpanel allows you to tie data to a specific user, creating a profile. This is where you store things like their email address, where they came from, or their age.

https://mixpanel.com/help/reference/creating-a-profile

Function (optional) provided as second argument to middleware should be selector returning flat object for given state, see some examples below.
Middlewares requires unique identifier of an user, which is just standard id. Provide function to get the id from state.

```js
const uniqueIdSelector = state => state.me.id; // unique identifier
const personSelector = state => state.me; // data passed down to mixpanel
let store = createStore(reducer, ['Initial State'], mixpanelMiddleware(token, personSelector, uniqueIdSelector));
```

## Example example

```js
function getPerson(state) {
    const {
        auth: {
            user: {
                id,
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

    const person = {
        clientId: clientId,
        clientName: clientName,
        $first_name: firstName,
        $last_name: lastName,
        $email: username,
    };
}
```

## Notes
> Special properties have a leading "$". You shouldn't make up your own property names beginning with "$".

List of special properties
https://mixpanel.com/help/questions/articles/special-or-reserved-properties

# Redux Actions

## Event

```js

const action = {
    type: 'Login',
    meta: {
        mixpanel: {
            source: 'website',
        },
    },
}
```

## Increment

> You can use mixpanel.people.increment to change the current value of numeric properties. This is useful when you want to keep a running tally of things, such as games played, messages sent, or points earned.

```js
// counting logins
const action = {
   type: 'Login',
   meta: {
       mixpanelIncrement: ['login'],
   },
}
```

You can combine standard `events` with `increments`

# Warning
This is **client side mixpanel** middleware, it should be possible to make universal and support server side rendering.

Until then, you need to wrap in condition. Mixpanel-browser package requires `window` to be set, otherwise it crashes.

```js
  const middlewares = [];
  if (__CLIENT__) {
    middlewares.push(require('./mixpanelMiddleware').default(token, personSelector, idSelector));
  }
```


Library mixpanel-node https://github.com/mixpanel/mixpanel-node could be used to make middleware universal.

# Credits
Thanks to [Harry](https://twitter.com/hogg_io) and [Andy](https://twitter.com/andrew_polhill) for implementing the middleware! Kudos to them.