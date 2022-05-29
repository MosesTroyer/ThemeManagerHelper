import fs from 'fs';
import React, {ChangeEvent, ReactNode} from 'react';
import './themeManager.scss';
import {ToastType} from './toast';

interface IThemeManagerProps {
  addToast: (type: ToastType, title: string, message: string) => void;
  themeFile?: Document;
  onLoad(themeFile: Document): void;
  onUpdate(): void;
}

interface IThemeManagerState {
  fileLocation: string;
}

export class ThemeManager extends React.Component<IThemeManagerProps, IThemeManagerState> {
  constructor(props: any) {
    super(props);

    this.state = {
      fileLocation: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Cities_Skylines\\BuildingThemes.xml',
    };
  }

  async load(): Promise<void> {
    const themeFile = await fs.promises.readFile(this.state.fileLocation)
      .catch(error => {
        console.error(error);
        this.props.addToast(ToastType.ERROR, 'Error', 'Could not read theme file.');
      });

    if (!themeFile) {
      return;
    }

    const parser = new DOMParser();
    this.props.onLoad(parser.parseFromString(themeFile.toString(), 'text/xml'));
  }

  async save(): Promise<void> {
    const doc = this.props.themeFile?.documentElement;

    if (!doc) {
      console.error('No document in state');
      this.props.addToast(ToastType.ERROR, 'Error', 'Could not save theme file- internal error');
      return;
    }

    await fs.promises.writeFile(this.state.fileLocation, new XMLSerializer().serializeToString(doc))
      .catch(error => {
        console.error(error);
        this.props.addToast(ToastType.ERROR, 'Error', 'Could not save theme file.');
      });

    this.props.addToast(ToastType.SUCCESS,'Save Successful', '');
  }

  removeTheme(theme: Element): void {
    theme.parentElement?.removeChild(theme);

    this.props.onUpdate();
  }

  render(): ReactNode {
    const themeContainer = this.props.themeFile?.getElementsByTagName('Themes').item(0);
    const themeElements = themeContainer?.getElementsByTagName('Theme');
    const themes = [];
    if (themeElements) {
      for (let i = 0; i < themeElements.length; i++) {
        const theme: Element | null = themeElements.item(i);

        if (!theme) {
          continue
        }

        themes.push(
          <div className={'themeDisplay'}>
            <span className={'themeName'}>
              { theme.getAttribute('name') }
            </span>

            <button className={'themeRemove'} onClick={ () => { this.removeTheme(theme)} }>
              Delete
            </button>
          </div>
        );
      }
    }

    return (
      <div className={'themeManager'}>
        <div className={'themeControls'}>
          <label htmlFor={'buildingThemesLocation'}>BuildingThemes.xml File Location</label>
          <br/>
          <input id='buildingThemesLocation'
                 type={'text'}
                 value={ this.state.fileLocation }
                 onChange={ (v: ChangeEvent<HTMLInputElement>) => { this.setState({ fileLocation: v.target.value });} }
          />

          <br />

          <button onClick={ async () => { await this.load(); }}>Load</button>
          <button onClick={ async () => { await this.save(); }}>Save</button>
        </div>

        <div className={'themeContainer'}>
          {
            themes
          }
        </div>

      </div>
    );
  }
}
