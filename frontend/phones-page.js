'use strict';

import { Search } from './components/search';
import { PhoneViewer } from './components/phone-viewer';
import { PhoneCatalogue } from './components/phone-catalogue';
import { ShoppingCart } from './components/shopping-cart';
import { HttpService } from './services/http-service';


export class PhonesPage {
  constructor(options) {
    this._el = options.el;

    this._cart = new ShoppingCart({
      el: this._el.querySelector('[data-component="shopping-cart"]')
    });

    this._catalogue = new PhoneCatalogue({
      el: this._el.querySelector('[data-component="phone-catalogue"]'),
    });

    this._viewer = new PhoneViewer({
      el: this._el.querySelector('[data-component="phone-viewer"]'),
    });

    this._search = new Search({
      el: this._el.querySelector('[data-component="search"]'),
    });

    this._catalogue.on('phoneSelected', this._onPhoneSelected.bind(this));

    this._viewer.on('back', () => {
      this._viewer.hide();
      this._catalogue.show();
    });

    this._viewer.on('add', (event) => {
      let phoneDetails = event.detail;

      this._cart.addItem(phoneDetails);
    });

    this._search.on('valueChanged', (event) => {
      let searchValue = event.detail;

      this._loadPhones(searchValue);
    });

    if (window.location.hash) {
      let phoneId = window.location.hash.slice(9);

      this._getPhoneDetails(phoneId)
        .then((phoneDetails) => {
          this._showPhone(phoneDetails);
        });

    } else {
      this._loadPhones();
    }
  }

  _onPhoneSelected(event) {
    let phoneId = event.detail;

    this._showPhone(phoneId);

    let extraActionPromise = new Promise(
      (resolve, reject) => {

        let onExtraAction = () => {
          resolve();

          this._catalogue.off('extraAction', onExtraAction);
        };

        this._catalogue.on('extraAction', onExtraAction);
      }
    );
    let loadPhonePromise = this._getPhoneDetails(phoneId);

    Promise.all([extraActionPromise, loadPhonePromise])
      .then(
        (results) => {
          let phoneDetails = results[1];

          this._showPhone(phoneDetails);
        }
      );
  }

  /**
   * Return promise with phone details from server
   *
   * @param {integer} phoneId - id of phone
   *
   * @returns Promise
   * @private
   */
  _getPhoneDetails(phoneId) {
    return HttpService.getJSON(`/data/phones/${phoneId}.json`);
  }

  _showPhone(phoneDetails) {
    this._catalogue.hide();
    this._viewer.showPhone(phoneDetails);
  }

  _loadPhones(query) {
    let url = `/data/phones/phones.json`;

    if (query) {
      url += `?query=${query}`
    }

    HttpService.getJSON(url)
      .then(
        (phones) => {
          // until our server can filter phones
          let filteredPhones = this._filterPhones(phones, query);

          this._catalogue.showPhones(filteredPhones);
        }
      );
  }

  _filterPhones(phones, query) {
    if (!query) {
      return phones;
    }

    let normalizedQuery = query.toLowerCase();

    return phones.filter((phone) => {
      return phone.name.toLowerCase().includes(normalizedQuery);
    });
  }
}