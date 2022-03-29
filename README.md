# svelte-forms_issue

**Validator _email_ doesn't work**

The documentation for the email validator differs  from code.

_documentation  :_
**email**
```
function email() => { valid: boolean, name : 'email' };
import { field } from 'svelte-forms';
import { email } from 'svelte-forms/validators'; 
```

```
const name = field('name', '', [email()]);
```

_code  :_

**../node_modules/svelte-forms/validators**
```
export function email() {
    return (value) => {
        const regex = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;
        return { valid: Boolean(value) && regex.test(value), name: 'not_an_email' };
    };
}
```

_Because we have different names this validator can not work as explained in documentation._

[See example of this issue](url)



