import { Component } from '@angular/core';
import { Zeroconf } from '@ionic-native/zeroconf/ngx';
import { LoadingController } from '@ionic/angular';
import { ToastController, AlertController } from '@ionic/angular';
import { orderBy, uniqBy } from 'lodash';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {

  registerdServices: ServiceModel[];
  loading: HTMLIonLoadingElement;

  constructor(private zeroconf: Zeroconf, private loadingController: LoadingController, private toastController: ToastController,
              private alertCtrl: AlertController) {
    this.intializeVariables();
  }


  intializeVariables() {
    this.registerdServices = [];
  }

  watchService() {
    this.presentLoading();
    this.registerdServices = [];
    // watch for services of a specified type
    this.zeroconf.watch('_http._tcp.', 'local.').subscribe(result => {
      // if (result.action === 'resolved' || result.action === 'registered') {
      // if (result.action === 'added') {
      console.log(result.service.ipv4Addresses, result.service.ipv6Addresses[0]);
      let ipAddr = '0';
      if (result.service.ipv4Addresses.length > 0) {
        ipAddr = result.service.ipv4Addresses[0];
      }
      if (result.service.ipv6Addresses.length > 0 && ipAddr === '0') {
        ipAddr = result.service.ipv6Addresses[0];
      }
      this.registerdServices.push({
        serviceName: result.service.name, ipAddress: ipAddr,
        portNumber: result.service.port, serviceType: result.service.type,
        serviceStatus: result.action
      });
      this.registerdServices = orderBy(this.registerdServices, ['serviceName', 'ipAddress'], ['desc', 'desc']);
      this.registerdServices = this.registerdServices.filter(element => {
        return element.ipAddress !== null;
      });
      this.registerdServices = uniqBy(this.registerdServices, (e) => {
        return e.serviceName;
      });
      //  }
      this.dismissLoader();
    });
  }

  registerService(serviceName: string, port: number) {
    // publish a zeroconf service of your own
    this.presentLoading();
    this.zeroconf.register('_http._tcp.', 'local.', serviceName, port, {}).then(result => {
      this.presentToast('Your service has been added.');
      this.dismissLoader();
    });
  }

  async presentAlertPrompt() {
    const alert = await this.alertCtrl.create({
      header: 'Register Service',
      inputs: [
        {
          name: 'serviceName',
          type: 'text',
          placeholder: 'Service Name'
        },
        {
          name: 'port',
          type: 'number',
          placeholder: 'Port'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => { }
        }, {
          text: 'Ok',
          handler: (data) => {
            if (data.serviceName.length > 0 && data.port > 0) {
              this.registerService(data.serviceName, data.port);
            } else {
              this.presentToast('Please enter valid input.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async presentLoading() {
    this.loading = await this.loadingController.create({
      message: 'Please wait...',
      duration: 2000
    });
    await this.loading.present();
  }

  async dismissLoader() {
    if (this.loading) {
      await this.loading.dismiss();
    }
  }

  async presentToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000
    });
    toast.present();
  }
}


interface ServiceModel {
  serviceName: string;
  serviceStatus: string;
  serviceType: string;
  ipAddress: any;
  portNumber: number;
}
