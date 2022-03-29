**Validator _email_ doesn't work**

[See example of this issue with solution](https://github.com/BogdanGorelkin/svelte-forms_issue/blob/main/src/App.svelte)

The documentation for the email validator differs  from code.

**Documentation  :**
_[email](https://chainlist.github.io/svelte-forms/#:~:text=field(%27name%27%2C%20%27%27%2C%20%5Brequired()%5D)%3B-,email,-function%20email()%20%3D%3E%20%7B%20valid)_
```
function email() => { valid: boolean, name : 'email' };
import { field } from 'svelte-forms';
import { email } from 'svelte-forms/validators'; 
```

```
const name = field('name', '', [email()]);
```

**Code  :**

[_../node_modules/svelte-forms/validators_](https://github.com/BogdanGorelkin/svelte-forms_issue/blob/main/node_modules/svelte-forms/validators/email.js)
```
export function email() {
    return (value) => {
        const regex = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;
        return { valid: Boolean(value) && regex.test(value), name: 'not_an_email' };
    };
}
```

_Since we have different names this validator can not work as explained in documentation._

From my point of view there are two possible solutions:
1. in **email.js** file _not_an_email_ should be replaced as _email_
2. in **documentation** _email_ should be replaced as _not_an_email_


