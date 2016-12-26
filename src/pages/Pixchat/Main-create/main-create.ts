import { Component, OnInit } from '@angular/core';
import { NavController, ViewController, LoadingController , ActionSheetController} from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, AbstractControl} from '@angular/forms';
import { Camera, CameraOptions } from 'ionic-native';


import { IThread } from '../../../shared/interfaces';
import { AuthService } from  '../../../shared/services/auth.service';
import { DataService } from '../../../shared/services/data.service';
import {Firebaseimgurl} from '../../../shared/services/firebaseimg.service';

@Component({
  templateUrl: 'main-create.html'
})
export class MainCreatePage implements OnInit {

  createThreadForm: FormGroup;
  title: AbstractControl;
  desc: AbstractControl;
  category: AbstractControl;  
  ImageUpload: Blob;
  imgUrl:string = "errrrr";

  constructor(public nav: NavController,
    public loadingCtrl: LoadingController,
    public viewCtrl: ViewController,
    public fb: FormBuilder,
    public authService: AuthService,
    public actionSheeCtrl: ActionSheetController,
    private firebaseimgurl:Firebaseimgurl,
    public dataService: DataService) {}
    
    

    get Fimgurl() {
        return this.firebaseimgurl.getValue;
    }

  ngOnInit() {
    console.log('in Main create..');
    this.createThreadForm = this.fb.group({
      'title': ['', Validators.compose([Validators.required, Validators.minLength(3)])],
      'desc': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      'category': ['', Validators.compose([Validators.required, Validators.minLength(1)])],
    });

    this.title = this.createThreadForm.controls['title'];
    this.desc = this.createThreadForm.controls['desc'];
    this.category = this.createThreadForm.controls['category'];
  }

  cancelNewThread() {
    this.viewCtrl.dismiss();
  }

  onSubmit(thread: any): void {
    console.log('submit');
    var self = this;


    if (this.createThreadForm.valid) {
      let loader = this.loadingCtrl.create({
        content: 'Posting thread...',
        dismissOnPageChange: true
      });
      console.log('loading preset');
      loader.present();
      console.log('loading submit');
    
      let uid = self.authService.getLoggedInUser().uid;
      self.dataService.getUsername(uid).then(function (snapshot) {
        let username = snapshot.val();

        self.dataService.getTotalThreads().then(function (snapshot) {
          let currentNumber = snapshot.val();
          let newPriority: number = currentNumber === null ? 1 : (currentNumber + 1);
          //!! need to check condition not uplaoad
          
          let newThread: IThread = {
            key: null,
            title: thread.title,
            imgurl: this.Firebaseimgurl.getval(),
            desc: thread.desc,
            category: thread.category,
            user: { uid: uid, username: username },
            dateCreated: new Date().toString(),
            comments: null
          };

          self.dataService.submitThread(newThread, newPriority)
            .then(function (snapshot) {
              loader.dismiss()
                .then(() => {
                  self.viewCtrl.dismiss({
                    thread: newThread,
                    priority: newPriority
                  });
                });
            }, function (error) {
              // The Promise was rejected.
              console.error(error);
              loader.dismiss();
            });
        });
      });
    }
  }

  
  openImageThreadOptions() {
    var self = this;

    let actionSheet = self.actionSheeCtrl.create({
      title: 'Upload new image from',
      buttons: [
        {
          text: 'Camera',
          icon: 'camera',
          handler: () => {
            self.openCamera(Camera.PictureSourceType.CAMERA);
          }
        },
        {
          text: 'Album',
          icon: 'folder-open',
          handler: () => {
            self.openCamera(Camera.PictureSourceType.PHOTOLIBRARY);
          }
        }
      ]
    });

    actionSheet.present();
  }

  openCamera(pictureSourceType: any) {
    var self = this;

    let options: CameraOptions = {
      quality: 95,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: pictureSourceType,
      encodingType: Camera.EncodingType.PNG,
      targetWidth: 400,
      targetHeight: 400,
      saveToPhotoAlbum: true,
      correctOrientation: true
    };

    Camera.getPicture(options).then(imageData => {
      const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
          const slice = byteCharacters.slice(offset, offset + sliceSize);

          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);

          byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: contentType });
        return blob;
      };

      let capturedImage: Blob = b64toBlob(imageData, 'image/png');
      // start 
      self.startUploading(capturedImage); //upload on submit instread  need to create func update img card
    }, error => {
      console.log('ERROR -> ' + JSON.stringify(error));
    });
  }

  startUploading(file) {

    let self = this;
    let uid = self.authService.getLoggedInUser().uid;
    let progress: number = 0;
    // display loader
    let loader = this.loadingCtrl.create({
      content: 'Uploading image..',
    });
    loader.present();

    // Upload file and metadata to the object 'images/mountains.jpg'
    var metadata = {
      contentType: 'image/png',
      name: 'thread.png',
      cacheControl: 'no-cache',
    };

    //!! Image Replace themself on firebase
    var uploadTask = self.dataService.getStorageRef().child('threads/' + uid +'/temp.png').put(file, metadata);

    console.log('gen upload task');
    // Listen for state changes, errors, and completion of the upload.
    uploadTask.on('state_changed',
      function (snapshot) {
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('progress'+progress);
      }, function (error) {
        loader.dismiss().then(() => {
          switch (error.code) {
            case 'storage/unauthorized':
              console.log("User doesn't have permission to access the object");
              break;

            case 'storage/canceled':
              console.log("User canceled the upload");
              break;

            case 'storage/unknown':
              console.log("Unknown error occurred, inspect error.serverResponse");
              break;
          }
        });
      }, function () {
        loader.dismiss().then(() => { 
          console.log(uploadTask.snapshot.downloadURL);
    
          this.Firebaseimgurl.setval(uploadTask.snapshot.downloadURL);
           console.log(this.Firebaseimgurl.getval());
          // Upload completed successfully, now we can get the download URL
          //console.log('Upload URL : '+ this.uploadTask.snapshot.downloadURL);
          //return uploadTask.snapshot.downloadURL;
          
        });
      });
  }



//-addd-------------------------------------------------------------- 



}
