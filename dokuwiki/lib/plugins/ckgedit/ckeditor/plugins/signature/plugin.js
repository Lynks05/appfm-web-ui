CKEDITOR.plugins.add("signature",{init:function(a){var b=a.lang.signature;if(!b){b=CKEDITOR.lang["default"]["signature"]}a.addCommand("insertSignature",{numbersToTwoDigits:function(c){if(c<10){c="0"+c}return(c)},exec:function(g){var h=oDokuWiki_FCKEditorInstance.fckgUserName;var f=oDokuWiki_FCKEditorInstance.fckgUserMail;var i=new Date();var c=i.getFullYear()+"/"+this.numbersToTwoDigits(i.getMonth()+1)+"/"+this.numbersToTwoDigits(i.getDate())+" "+this.numbersToTwoDigits(i.getHours())+":"+this.numbersToTwoDigits(i.getMinutes());var e='&mdash; <i><a href="mailto:'+f+'">'+h+"</a> "+c+"</i>&mdash;";g.insertHtml(e)}});a.ui.addButton("Signature",{label:b.ToolTip,command:"insertSignature",icon:this.path+"images/sig.png"})}});