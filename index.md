### API Token
<div style="display: flex;">
<input id="tokenInput" style="flex-grow: 1;" spellcheck="false"><button id="okButton">OK</button>
</div>

Enter key from <https://developer.fugle.tw/docs/key/>

### Web Apps
* [Chart App](web/chartApp/)
* [Quote App](web/quoteApp/)

<style>
h1,
.footer {
	display: none;
}

.markdown-body {
	margin-top: 0!important;
	word-break: break-all;
}
</style>
<script>
const key = 'FugleApi.apiToken';
tokenInput.value = localStorage.getItem(key) || 'demo';
tokenInput.onpaste = tokenInput.onchange = okButton.onclick = () => {
	localStorage.setItem(key, tokenInput.value);
	location.reload();
};
tokenInput.onfocus = function() {
	this.select();
};
</script>
