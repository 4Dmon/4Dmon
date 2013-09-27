$.ajax({
	url: "/4d/server/execScript/start"
}).done(function(html){
	$(".span6").append(html);
});