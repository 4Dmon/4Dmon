$.ajax({
	url: "/4d/client/execScript/start"
}).done(function(html){
	$(".span6").append(html);
});