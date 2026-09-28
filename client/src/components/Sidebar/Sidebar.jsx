import {
    Sidebar as SidebarContainer,
    Brand,
    BrandMark,
    BrandText,
    Nav,
    NavItem,
    NavDot,
    SidebarFooter,
} from "./Sidebar.styles.js";


export const Sidebar = () => {
    return (
        <SidebarContainer>
            <div>
                <Brand>
                    <BrandMark>
                        LB
                    </BrandMark>

                    <BrandText>
                        <strong>
                            LeadBot
                        </strong>

                        <span>
                            Automation
                        </span>
                    </BrandText>
                </Brand>

                <Nav>
                    <NavItem
                        to="/"
                        end
                    >
                        <NavDot />
                        Сканер сайтов
                    </NavItem>

                    <NavItem
                        to="/companies"
                    >
                        <NavDot />
                        База компаний
                    </NavItem>

                    <NavItem
                        to="/campaigns"
                    >
                        <NavDot />
                        Кампании
                    </NavItem>

                    <NavItem
                        to="/history"
                    >
                        <NavDot />
                        История
                    </NavItem>
                </Nav>
            </div>

            <SidebarFooter>
                <div>
                    <span>
                        Версия
                    </span>

                    <strong>
                        0.3
                    </strong>
                </div>
            </SidebarFooter>
        </SidebarContainer>
    );
};
