import React from "react";
import ReactDOM from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import { Nav, Collapse } from "reactstrap";
import PerfectScrollbar from "perfect-scrollbar";

var ps;

const FixedSidebar = (props) => {
  const [state, setState] = React.useState({});
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);
  const sidebarRef = React.useRef(null);
  const location = useLocation();

  React.useEffect(() => {
    setHasMounted(true);
    setState(getCollapseStates(props.routes));
  }, []);

  React.useEffect(() => {
    if (hasMounted && navigator.platform.indexOf("Win") > -1) {
      ps = new PerfectScrollbar(sidebarRef.current, {
        suppressScrollX: true,
        suppressScrollY: false,
      });
    }
    return function cleanup() {
      if (hasMounted && navigator.platform.indexOf("Win") > -1) {
        ps.destroy();
      }
    };
  }, [hasMounted]);

  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);
  const closeMobileSidebar = () => setIsMobileOpen(false);

  const getCollapseStates = (routes) => {
    let initialState = {};
    routes.map((prop, key) => {
      if (prop.collapse) {
        initialState = {
          [prop.state]: getCollapseInitialState(prop.views),
          ...getCollapseStates(prop.views),
          ...initialState,
        };
      }
      return null;
    });
    return initialState;
  };

  const getCollapseInitialState = (routes) => {
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse && getCollapseInitialState(routes[i].views)) {
        return true;
      } else if (window.location.href.indexOf(routes[i].path) !== -1) {
        return true;
      }
    }
    return false;
  };

  const createLinks = (routes) => {
    const { rtlActive } = props;
    return routes.map((prop, key) => {
      if (prop.redirect) return null;
      if (prop.collapse) {
        var st = {};
        st[prop["state"]] = !state[prop.state];
        return (
          <li className={getCollapseInitialState(prop.views) ? "active" : ""} key={key}>
            <a href="#" data-toggle="collapse" aria-expanded={state[prop.state]} onClick={(e) => { e.preventDefault(); setState({ ...state, ...st }); }}>
              {prop.icon !== undefined ? (
                <>
                  <i className={prop.icon} />
                  <p className={'text-white'}>{rtlActive ? prop.rtlName : prop.name}<b className="caret" /></p>
                </>
              ) : (
                <>
                  <span className="sidebar-normal text-white">{rtlActive ? prop.rtlName : prop.name}<b className="caret" /></span>
                </>
              )}
            </a>
            <Collapse isOpen={state[prop.state]}><ul className="nav">{createLinks(prop.views)}</ul></Collapse>
          </li>
        );
      }
      return (
        <li className={activeRoute(prop.layout + prop.path)} key={key}>
          <NavLink to={prop.layout + prop.path} onClick={() => { if (props.closeSidebar) props.closeSidebar(); setIsMobileOpen(false); }}>
            {prop.icon !== undefined ? (
              <>
                <i className={prop.icon} />
                <p className={'text-white'}>{rtlActive ? prop.rtlName : prop.name}</p>
              </>
            ) : (
              <span className="sidebar-normal text-white">{rtlActive ? prop.rtlName : prop.name}</span>
            )}
          </NavLink>
        </li>
      );
    });
  };

  const activeRoute = (routeName) => (location.pathname === routeName ? "active" : "");

  const { activeColor, logo } = props;
  let logoImg = null;
  let logoText = null;

  if (logo !== undefined) {
    const closeAll = () => {
      if (props.closeSidebar) props.closeSidebar();
      setIsMobileOpen(false);
    };
    if (logo.outterLink !== undefined) {
      logoImg = (<a href={logo.outterLink} className="simple-text logo-mini" target="_blank" onClick={closeAll}><div className="logo-img"><img src={logo.imgSrc} alt="react-logo" /></div></a>);
      logoText = (<a href={logo.outterLink} className="simple-text logo-normal" target="_blank" onClick={closeAll}>{logo.text}</a>);
    } else {
      logoImg = (<NavLink to={logo.innerLink} className="simple-text logo-mini" onClick={closeAll}><div className="logo-img"><img src={logo.imgSrc} alt="react-logo" /></div></NavLink>);
      logoText = (<NavLink to={logo.innerLink} className="simple-text logo-normal" onClick={closeAll}>{logo.text}</NavLink>);
    }
  }

  const sidebarContent = (
    <>
      <button className="mobile-menu-toggle" onClick={toggleMobileSidebar} aria-label="Toggle mobile menu"><i className="fas fa-bars"></i></button>
      <div className={`sidebar-overlay ${isMobileOpen ? 'show' : ''}`} onClick={closeMobileSidebar} />
      <div className={`fixed-sidebar-container ${isMobileOpen ? 'open' : ''}`} data={activeColor}>
        <div className="fixed-sidebar-wrapper" ref={sidebarRef}>
          {logoImg !== null || logoText !== null ? (<div className="logo">{logoImg}{logoText}</div>) : null}
          <Nav>{createLinks(props.routes)}</Nav>
        </div>
      </div>
    </>
  );

  if (!hasMounted) return null;
  return ReactDOM.createPortal(sidebarContent, document.body);
};

export default FixedSidebar;