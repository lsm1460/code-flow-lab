import { useState } from 'react';
import ElementPanel from './elementPanel';
import FunctionPanel from './functionPanel';
import VariablePanel from './variablePanel';

import classNames from 'classnames/bind';
import styles from './panel.module.scss';
import GroupPanel from './groupPanel';
const cx = classNames.bind(styles);

interface Props {
  activePanel: 'element' | 'function' | 'variable' | 'group' | '';
  handleClosePanel: () => void;
}
function ToolbarPanel({ activePanel, handleClosePanel }: Props) {
  const [isSubOpen, setIsSubOpen] = useState(false);

  return (
    <>
      <div className={cx('toolbar-panel-wrap', { active: activePanel })}>
        {
          {
            element: <ElementPanel />,
            function: <FunctionPanel />,
            variable: <VariablePanel isSubOpen={isSubOpen} setIsSubOpen={setIsSubOpen} />,
            group: <GroupPanel />,
          }[activePanel]
        }
      </div>
      <div className={cx('panel-dim', { active: activePanel })} onClick={handleClosePanel}></div>
    </>
  );
}

export default ToolbarPanel;
