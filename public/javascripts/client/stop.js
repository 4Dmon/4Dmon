$.ajax({
	url: "/4d/client/execScript/stop"
}).done(function(html){
	$(".span6").append(html);
});