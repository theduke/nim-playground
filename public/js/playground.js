"use strict";

(function() {

	var Playground = {

		processing: false,
		editor: null,

		init: function() {
			var that = this;

			console.log("Initializing Ace editor.");
			var editor = ace.edit("editor");
	    	editor.setTheme("ace/theme/chrome");
	    	editor.session.setMode("ace/mode/python");

	    	this.editor = editor;

	    	$(".runner").click(function(evt) {
	    		that.execute();		
	    	});
		},

		execute: function() {
			if (this.processing) {
				return;
			}

      var that = this;

			var code = this.editor.getValue().trim();
			if (code !== "") {
				$(".loader").css("display", "inline");
				$(".runner").attr("disabled", "");
				this.setStatus("Processing...", "warning");
        $("#result").html("");

				$.ajax({
          url: "/api/execute",
          method: "POST",
					data: code,
          contentType: "application/json",
				}).then(function(data) {
          console.log("Parsing json response ", data);
          data = JSON.parse(data);
          console.log("Parsed json: ", data);

					if (data.status === "success") {
						var msg = "Compilation took " + data.compileTime + "s" + ", " + "execution " + data.executionTime + "s";
						that.setStatus(msg, "success");
					} else if (data.status === "compileError") {
						var msg = "Compilation error";
						that.setStatus(msg, "danger")
					} else if (data.status === "executionError") {
						var msg = "Compilation succeded but execution failed";	
						that.setStatus(msg, "danger");
					}

					$("#result").html(data.result);

					$(".loader").css("display", "none");
					$(".runner").removeAttr("disabled");

				}, function(err) {
					that.setStatus("An error occurred", "error");
					$(".loader").css("display", "none");
					$(".runner").removeAttr("disabled");
				});
			}
		},

		setStatus(msg, typ) {
			$("#status-alert").html(msg).attr("class", "alert alert-" + typ);
		}
	};

	$(function() {
		Playground.init();
	});

})(this);
