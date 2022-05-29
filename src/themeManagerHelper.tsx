import React from 'react';
import ReactDOM from 'react-dom';
import {ThemeManager} from './components/themeManager';
import {Toast, ToastData, ToastType} from './components/toast';
import './themeManagerHelper.scss';
import {Generator} from './components/generator';

interface IAppState {
  toasts: ToastData[]
  themeFile?: Document;
}

export class ThemeManagerHelper extends React.Component<any, IAppState> {

  toastId = 0;

  addToast = (type: ToastType, title: string, message: string) => {
    this.state.toasts.push({
      id: this.toastId++,
      title,
      message,
      backgroundColor: type
    });

    this.setState(this.state);
  };

  onLoad = (themeFile: Document) => {
    this.setState({
      themeFile
    });
  };

  onUpdate = () => {
    this.setState(this.state);
  }

  constructor(props: any) {
    super(props);

    this.state = {
      toasts: [],
      themeFile: undefined
    };
  }

  render() {
    return (
      <div>
        <Toast toasts={ this.state.toasts }/>

        <div className={'appDisplay'}>
          <div>
            <Generator addToast={ this.addToast } themeFile={ this.state.themeFile } onUpdate={ this.onUpdate }/>
          </div>
          <div>
            <ThemeManager addToast={ this.addToast } onLoad={ this.onLoad } onUpdate={ this.onUpdate } themeFile={ this.state.themeFile }/>
          </div>
        </div>

      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', (_) => {
  ReactDOM.render(<ThemeManagerHelper />, document.getElementById('root'));
});

/*
  Sources:
  - https://www.sitepen.com/blog/getting-started-with-electron-typescript-react-and-webpack


*/