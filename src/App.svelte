<script>
	import { form, field} from 'svelte-forms';
	import { required, email, url } from 'svelte-forms/validators';

	const userEmail = field('userEmail', '', [email()]);
	const something = field('something', '', [required()]);
	const someurl = field('someurl', '', [url()]);

	const myForm = form(userEmail, something, someurl);

	$userEmail.value = 'bogdan@gorelkin.me'
	$something.value = 'text' 
	$someurl.value = 'https://b.gorelkin.me/'

	  
</script>
<section>	

email

<!-- It will not work
	<input type="text" placeholder="Type email" name="email" bind:value={$userEmail.value} on:mousedown={() => console.log('email:',$myForm.hasError('userEmail.email'))}>
	{#if $myForm.hasError('userEmail.email')}<div style="background-color:tomato;">email!</div>{/if}<br>	
-->
	<input type="text" placeholder="Type email" name="email" bind:value={$userEmail.value} on:mousedown={() => console.log('email:',$myForm.hasError('userEmail.not_an_email'))}>
	{#if $myForm.hasError('userEmail.not_an_email')}<div style="background-color:tomato;">email!</div>{/if}<br>

required
	<input type="text" bind:value={$something.value} on:mousedown={() => 			console.log('required:',$myForm.hasError('someurl.required'))}>
	{#if $myForm.hasError('something.required')}<div style="background-color:tomato;">required!</div>{/if}<br>

url
	<input type="text" bind:value={$someurl.value} on:mousedown={() => console.log('url:',$myForm.hasError('someurl.url'))}>
	{#if $myForm.hasError('someurl.url')}<div style="background-color:tomato;">url!</div>{/if}<br>

  </section>