/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import "./RadioCard.scss";

export interface RadioCardEntry {
  image: string;
  value: string;
}

interface RadioCardProps {
  entries: RadioCardEntry[];
  selected: string;
  onChange: ((value: string) => void);
}

/** A React component that renders the UI specific for this component */
export class RadioCard extends React.Component<RadioCardProps, {}> {

  constructor(props?: any, context?: any) {
    super(props, context);
  }

  private _onCardSelected = (event: any) => {
    this.props.onChange(event.target.id);
  }

  private createElementsForCard(entry: RadioCardEntry, index: number, entries: RadioCardEntry[]) {
    let divClass = "card card-body";

    if (0 === index) {
      divClass += " card-first";
    } else if (entries.length - 1 === index) {
      divClass += " card-last";
    }

    const isChecked = this.props.selected === entry.value;

    return (
      <>
        <label className="card-radio-btn">
          <input type="radio" name="demo" className="card-input-element d-none" id={entry.value} checked={isChecked} onChange={this._onCardSelected} />
          <div className={divClass}>
            <img src={entry.image} alt={entry.value} />
          </div>
        </label>
      </>
    );
  }

  /** The sample's render method */
  public render() {
    return (
      <>
        <div className="card-radio">
          {this.props.entries.map((entry: RadioCardEntry, index, entries) => this.createElementsForCard(entry, index, entries))}
        </div>
      </>
    );
  }
}
