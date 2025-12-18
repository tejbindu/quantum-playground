import { useState } from "react";
import "./index.css"

export function TabbedWindows({ tabList }: { tabList: [string, React.JSX.Element][] }) {

    const [currentTabIndex, setCurrentTabIndex] = useState(0)

    return (
	<>
	{
	    tabList.map(([label, component], index) => (
		<button className="tab-button" onClick={ () => setCurrentTabIndex(index) }>{label}</button>
	    ))
	}
	{tabList[currentTabIndex]?.[1]}
	</>
    );
}
