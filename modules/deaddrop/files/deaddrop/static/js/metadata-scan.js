(function metadataScan(){

  // Message to source if the file is a format that cannot be scanned or the
  // scan fails
  var unableToScanMessage = 'WARNING: Unable to scan file metadata.\n\n' +
    'Are you sure that files you are uploading do not contain any information ' +
    'that might reveal your identity?';

  // Message to source if metadata has been found. The metadata is listed below
  // the message
  var confirmMessage = 'Are you sure the following information about the PDF ' +
    'file DOES NOT compromise your identity?';

  // ID of element that files are uploaded to
  var fileInputID = 'fh';

  // Scan all uploaded files (requires FileReader API) and warn user if the
  // files cannot be scanned or display the metadata if it is a PDF
  function scanUploadedFilesForMetadata() {

    var i = 0;
    var upload = document.getElementById(fileInputID);
    var files = upload.files;
    var unconfirmedFiles = false;

    if (!window.FileReader || !files.length) {
      unconfirmedFiles = true;
    }else{
      for (i = 0; i < files.length; i++) {
        if (files[i].type.match(/pdf/i)){
          scanPDFFile(files[i]);
        }else{
          unconfirmedFiles = true;
        }
      }
    }
    if (unconfirmedFiles){
      warnUser(unableToScanMessage);
    }
  }

  // Scan the PDF file for metadata and display to user to confirm
  function scanPDFFile(file){
    var fileReader = new FileReader();
    fileReader.onload = function loaded(evt) {
      var buffer = evt.target.result;
      var uint8Array = new Uint8Array(buffer);
      window.PDFJS.getDocument({data: uint8Array}).then(
        confirmPDFMetadataIsOk,
        function error(message){
          if (console && console.error){
            console.error(message);
          }
          warnUser(unableToScanMessage);
        }
      );
    };
    fileReader.readAsArrayBuffer(file);
  }

  // Ask the user ton confirm that the PDF metadata is acceptable
  function confirmPDFMetadataIsOk(pdf){
    var metadataToCheck = ['Author', 'Creator', 'Keywords', 'Subject'];
    var metadatum;
    var foundMetadata = false;
    var message = confirmMessage + '\n';
    for (var i = 0; i < metadataToCheck.length; i++) {
      metadatum = pdf.pdfInfo.info[metadataToCheck[i]];
      if (metadatum && metadatum.match(/\w/)){
        message += '\n' + metadataToCheck[i] + ': ' + metadatum;
        foundMetadata = true;
      }
    }
    if (foundMetadata){
      warnUser(message);
    }
  }

  // Warn the user using a confirm dialog. If the cancel is selected, clear the
  // file upload
  function warnUser(message){
    var upload = document.getElementById('fh');
    if (!window.confirm(message)){
      cancelUpload(upload, 'change', scanUploadedFilesForMetadata);
    }
  }

  // Clear file upload by recreating the input element
  function cancelUpload(el, eventName, listener){
    // cloneNode preserves the file so recreate the input instead
    var upload = document.getElementById(fileInputID);
    var attrsToClone = ['id', 'type', 'name', 'autocomplete'];
    var newElement = document.createElement(el.tagName);
    el.removeEventListener(eventName, listener);
    newElement.addEventListener(eventName, listener);
    for (var i = 0; i < attrsToClone.length; i++) {
      newElement.setAttribute(attrsToClone[i], el.getAttribute(attrsToClone[i]));
    }
    upload.parentNode.replaceChild(newElement, el);
  }

  // Add the metadata scan listener to the upload element
  var upload = document.getElementById(fileInputID);
  if (upload.addEventListener){
    upload.addEventListener('change', scanUploadedFilesForMetadata);
  }

}());
