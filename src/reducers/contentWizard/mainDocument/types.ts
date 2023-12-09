import { CodeFlowChartDoc } from '@/consts/types/codeFlowLab';
import { CSSProperties } from 'react';
import { ActionType } from 'typesafe-actions';
import * as actions from './actions';

export type DocumentAction = ActionType<typeof actions>;
export type FlowLog = { date: Date; text: string; type: 'log' | 'system' };

export type DocumentState = {
  contentDocument: CodeFlowChartDoc;
  selectedGroupId: string;
  openedGroupIdList: string[];
  sceneOrder: number;
  deleteTargetIdList: string[];
  flowLogList: FlowLog[];
  selectModal: SelectModal;
  addedStyles: { [_id: string]: CSSProperties };
  isSaved: boolean;
  openTime: number;
  isFullscreen: boolean;
  browserId: string;
};

export interface Operation {
  key: string;
  value: any;
  beforeValue?: any | undefined;
  isSkip?: boolean | undefined;
}

export interface SagaOperationParam {
  type: string;
  payload: Operation | Operation[];
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectModal {
  optionList: SelectOption[];
  onChange: (value: string | number) => void;
  defaultValue?: string | number;
  isSearchable?: boolean;
}
