export interface GlobalVars {
    path: string,
    accountId: string,
    sysCode: string,
    version: string,
    gatewayEnvPrefix: string,
    brandId: string,
    auth: any[],
    currentMenuId: string,
    menuSysCode: string
}

export default function getGlobalVars(): GlobalVars{
    return {
        path: (window as any)._path || '',
        accountId: ((window as any).userInfo || {}).accountId || '',
        sysCode: (window as any).sysCode || '',
        version: (window as any).version || '',
        gatewayEnvPrefix: (window as any).gatewayEnvPrefix || '',
        brandId: (window as any).currentBrandId || '',
        auth: (window as any).functions || [],
        currentMenuId: (window as any).currentMenu || (window as any).currentmenu || '',
        menuSysCode: (window as any).menuSysCode
    }
}