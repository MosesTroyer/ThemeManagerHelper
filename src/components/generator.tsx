import React, {ChangeEvent, ReactNode} from 'react';
import './generator.scss';
import axios from 'axios';
import fs from 'fs';
import {ToastType} from './toast';

interface IGeneratorProps {
  addToast: (type: ToastType, title: string, message: string) => void;
  themeFile?: Document;
  onUpdate(): void;
}

interface IGeneratorState {
  fileLocation: string;
  url: string;
  themeName: string;
}

export class Generator extends React.Component<IGeneratorProps, IGeneratorState> {

  constructor(props: any) {
    super(props);

    this.state = {
      fileLocation: 'C:\\Program Files (x86)\\Steam\\steamapps',
      url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=2427091823',
      themeName: 'My Theme'
    };
  }

  // gabe newell pls no be mad
  async addCollection(): Promise<void> {

    const url = this.state.url;

    const result = await axios.get(url)
      .catch((error) => {
        console.error(error);
        this.props.addToast(ToastType.ERROR, 'Error', `Unable to get collection: ${ error }`);
      });

    if (!result) {
      return;
    }

    const rawHtml: string = result.data;
    const parser = new DOMParser();
    const collectionHtml = parser.parseFromString(rawHtml, 'text/html');

    const [ workshopItemCollection, linkedCollections ] = collectionHtml.getElementsByClassName('collectionChildren');
    const collectionItemsElements = workshopItemCollection.getElementsByClassName('collectionItem');
    const itemIds: string[] = [];
    for (let i = 0; i < collectionItemsElements.length; i++) {
      // Really relying on the fact that steam never updates their looks
      const id = collectionItemsElements.item(i)?.id.split('_')[1];
      if (id !== undefined) {
        itemIds.push(id);
      }
    }

    const crps = [];
    let loadError = false;
    for (const id of itemIds) {
      let dir = await fs.promises.readdir(this.state.fileLocation + '\\workshop\\content\\255710\\' + id)
        .catch(_ => {
          console.error('Workshop item with ID ' + id + ' not found in directory- are you subscribed?');
        });

      if (!dir) {
        loadError = true;
        continue;
      }

      dir = dir.filter(name => name.endsWith('.crp'));

      for (const fileName of dir) {
        const crp = await fs.promises.readFile(this.state.fileLocation + '\\workshop\\content\\255710\\' + id + '\\' + fileName)
          .catch(error => {
            console.error(error);
          });

        if (!crp) {
          loadError = true;
          continue;
        }

        crps.push(CRP.parse(crp));
      }
    }

    if (loadError) {
      this.props.addToast(ToastType.ERROR, 'Error', 'An error occurred while adding some assets- not all will be present. Make sure you are subscribed to everything in the collection.');
    }

    const encodedAssetNames = crps
      .map((crp) => {
        return `${ crp.packageName }.${ crp.mainAssetName }_Data`;
      });

    console.log(encodedAssetNames);

    const themeFileXML = this.props.themeFile;

    if (!themeFileXML) {
      return;
    }

    const theme = themeFileXML.createElement('Theme');
    theme.setAttribute('name', this.state.themeName);
    const buildings = themeFileXML.createElement('Buildings');

    encodedAssetNames.forEach((name) => {
        const building = themeFileXML.createElement('Building');
        building.setAttribute('name', name);

        buildings.appendChild(building);
    });

    theme.appendChild(buildings);

    themeFileXML.getElementsByTagName('Themes').item(0)?.appendChild(theme);

    this.props.onUpdate();
  }

  render(): ReactNode {

    return (
      <div className={'generator'}>
        Create theme from collection

        <br />
        <br />

        <label htmlFor={'collectionUrl'}>
          Collection URL
        </label>
        <br />
        <input id="collectionUrl"
               type="text"
               value={ this.state.url }
               onChange={ (v: ChangeEvent<HTMLInputElement>) => { this.setState({ url: v.target.value });} }/>

        <br />

        <label htmlFor={'steamWorkshopLocation'}>Steam Workshop Location</label>
        <br/>
        <input id='steamWorkshopLocation'
               type={'text'}
               value={ this.state.fileLocation }
               onChange={ (v: ChangeEvent<HTMLInputElement>) => { this.setState({ fileLocation: v.target.value });} }
        />

        <label>
          Theme Name
        </label>
        <br />
        <input id="themeName" type="text"
               value={ this.state.themeName }
               onChange={ (v: ChangeEvent<HTMLInputElement>) => { this.setState({ themeName: v.target.value });} }/>

        <br />
        <br />
        <button onClick={ async () => { await this.addCollection() } } disabled={ !this.props.themeFile }>Create</button>
      </div>
    );
  }
}

class CRP {

  static readonly UInt8Length = 1;
  static readonly UInt16Length = 2;
  static readonly UInt32Length = 4;
  static readonly UInt64Length = 8;

  formatVersion: number | undefined;
  packageName: string | undefined;
  authorName: string | undefined;
  packageVersion: number | undefined;
  mainAssetName: string | undefined;
  fileCount: number | undefined;
  dataOffset: number | undefined;
  assets: Asset[] = [];

  removeme: any;

  static parse(file: Buffer): CRP {
    // https://skylines.paradoxwikis.com/CRAP_File_Format

    let bufferPointer = 4; // Skip the CRAP

    const crp = new CRP();
    crp.formatVersion = file.readUInt16LE(bufferPointer);
    bufferPointer += CRP.UInt16Length;

    [ crp.packageName, bufferPointer ] = CRP.parsePString(file, bufferPointer);
    [ crp.authorName, bufferPointer ] = CRP.parsePString(file, bufferPointer);

    crp.packageVersion = file.readUint32LE(bufferPointer);
    bufferPointer += CRP.UInt32Length;

    [ crp.mainAssetName, bufferPointer ] = CRP.parsePString(file, bufferPointer);

    // wasting time after this point

    crp.fileCount = file.readUint32LE(bufferPointer);
    bufferPointer += CRP.UInt32Length;

    // crp.dataOffset = file.readUInt16LE(bufferPointer);
    bufferPointer += this.UInt64Length;

    for (let i = 0; i < crp.fileCount; i++) {
      let asset;
      [ asset, bufferPointer ] = CRP.parseAsset(file, bufferPointer);
      crp.assets.push(asset);
    }

    crp.removeme = file;

    return crp;
  }

  static parseAsset(file: Buffer, bufferPointer: number): [ Asset, number ] {
    const asset = new Asset();

    [ asset.name, bufferPointer ] = CRP.parsePString(file, bufferPointer);
    [ asset.checksum, bufferPointer ] = CRP.parsePString(file, bufferPointer);

    asset.type = file.readUint32LE(bufferPointer);
    bufferPointer += CRP.UInt32Length;

    // offset
    bufferPointer += CRP.UInt64Length;

    // size
    bufferPointer += CRP.UInt64Length;

    return [ asset, bufferPointer ];
  }

  static parsePString(file: Buffer, bufferPointer: number): [ string, number ] {

    const length = file.readUInt8(bufferPointer);
    bufferPointer += CRP.UInt8Length;

    const pString = file.slice(bufferPointer, bufferPointer += length).toString();

    return [ pString, bufferPointer ];
  }

}

class Asset {
  name: string | undefined;
  checksum: string | undefined;
  type: number | undefined;
}