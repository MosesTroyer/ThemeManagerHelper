import fs from 'fs';
import React, {ChangeEvent, ReactNode} from 'react';
import './toast.scss';

/*
 - Based on https://blog.logrocket.com/how-to-create-a-custom-toast-component-with-react/

*/

export type ToastData = {
    id: number;
    title: string;
    message: string;
    backgroundColor: string;
}

export enum ToastType {
  SUCCESS = '#5cb85c',
  ERROR = '#d9534f'
}

interface IToastProps {
    toasts: ToastData[];
}

export class Toast extends React.Component<IToastProps, any> {
  id = 0;

  constructor(props: any) {
    super(props);

    this.state = {
      toasts: []
    };
  }

  deleteToast(id: number): void {
    const toastListItem = this.props.toasts.findIndex(e => e.id === id);
    this.props.toasts.splice(toastListItem, 1);

    this.setState(this.state);
  }

  render(): ReactNode {
    return (
      <div className={'notificationContainer topRight'}>
        {
          this.props.toasts.map((toast, i) =>
            <div className={'notification toast'} key={ i } style={{ backgroundColor: toast.backgroundColor }}>
              <button onClick={() => this.deleteToast(toast.id)}>X</button>
              <div>
                <p className="notificationTitle">{ toast.title }</p>
                <p className="notificationMessage">{ toast.message }</p>
              </div>
            </div>
          )
        }

      </div>
    );
  }
}

