$.ajax({
	url: "/4d/client/execScript/backup"
}).done(function(html){
	$(".span6").append(html);
});
