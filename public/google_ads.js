const { createApp } = Vue;

const params = new URLSearchParams(window.location.search);
const CAMPAIGN_STATUS_STORAGE_KEY = 'googleAdsCampaignStatuses';
const ASSET_RANDOM_CACHE_KEY = 'googleAdsAssetRandom_';
const DATE_FILTER_STORAGE_KEY = 'googleAdsDateFilter';
const DATE_FILTER_STORAGE_VERSION = 'yesterday-default-v1';

function readCampaignStatusOverrides() {
    try {
        const saved = JSON.parse(localStorage.getItem(CAMPAIGN_STATUS_STORAGE_KEY) || '{}');
        return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch (error) {
        return {};
    }
}

function getInitialPageMode() {
    if (window.GOOGLE_ADS_PAGE) {
        return window.GOOGLE_ADS_PAGE;
    }
    return getPageModeFromPath(window.location.pathname);
}

function getPageModeFromPath(pathname) {
    if (pathname.includes('/adassets')) return 'adassets';
    if (pathname.includes('/adgroups')) return 'adgroups';
    if (pathname.includes('/reporteditor')) return 'reporteditor';
    if (pathname.includes('/overview')) return 'overview';
    return 'campaigns';
}

function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function niceChartCeiling(value) {
    const number = safeNumber(value);
    if (number <= 0) return 2;

    const magnitude = Math.pow(10, Math.floor(Math.log10(number)));
    const normalized = number / magnitude;
    const niceSteps = [1, 2, 2.5, 3, 4, 5, 6, 8, 10];
    const niceStep = niceSteps.find(step => normalized <= step) || 10;

    return niceStep * magnitude;
}

function parseStoredDate(value) {
    if (!value) return null;
    const match = String(value).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatStoredDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function getDefaultDateFilter() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return {
        selectedDateOption: 'yesterday',
        appliedDateOption: 'yesterday',
        startDate: formatStoredDate(yesterday),
        endDate: formatStoredDate(yesterday)
    };
}

function readDateFilterState() {
    const defaultDateFilter = getDefaultDateFilter();
    let saved = {};
    try {
        saved = JSON.parse(sessionStorage.getItem(DATE_FILTER_STORAGE_KEY) || '{}');
    } catch (error) {
        saved = {};
    }

    if (saved.storageVersion !== DATE_FILTER_STORAGE_VERSION) {
        saved = {};
    }

    const startDate = parseStoredDate(saved.startDate) || parseStoredDate(defaultDateFilter.startDate);
    const endDate = parseStoredDate(saved.endDate) || parseStoredDate(defaultDateFilter.endDate);

    return {
        selectedDateOption: saved.selectedDateOption || defaultDateFilter.selectedDateOption,
        appliedDateOption: saved.appliedDateOption || defaultDateFilter.appliedDateOption,
        startDate,
        endDate
    };
}

createApp({
    data() {
        const initialDateFilter = readDateFilterState();
        return {
            pageMode: getInitialPageMode(),
            dropdown: '',
            campaignStatusOverrides: readCampaignStatusOverrides(),
            isNavCollapsed: localStorage.getItem('googleAdsNavCollapsed') === 'true',
            selectedCampaignId: params.get('campaignId') || '',
            selectedAdGroupId: params.get('adGroupId') || 'adgroup-1',
            showDatePicker: false,
            datePickerPositionTick: 0,
            selectedDateOption: initialDateFilter.selectedDateOption,
            appliedDateOption: initialDateFilter.appliedDateOption,
            compareEnabled: false,
            startDate: initialDateFilter.startDate,
            endDate: initialDateFilter.endDate,
            draftStartDate: null,
            draftEndDate: null,
            calendarMonth: initialDateFilter.startDate
                ? new Date(initialDateFilter.startDate.getFullYear(), initialDateFilter.startDate.getMonth(), 1)
                : new Date(2026, 3, 1),
            selectingStartDate: true,
            previewModal: null,
            isPreviewDetailsExpanded: true,
            isPreviewFullscreen: false,
            isContextBarHidden: false,
            ads_isCampaignOpen: true,
            ads_isInsightsReportsOpen: true,
            ads_isAudiencesOpen:false,
            ads_isAssetsOpen:false,
            isNotificationsOpen: false,
            isRefreshing: false,
            isSoftRefreshing: false,
            refreshMode: 'full',
            pageSize: 30,
            pageSizeOptions: [10, 30, 50, 100],
            showPageSizeDropdown: false,
            currentPage: 1,
            metricDeltaRatios: {},
            assetSortKey: 'cost',
            assetSortDirection: 'desc',
            tooltip: {
                visible: false,
                text: '',
                x: 0,
                y: 0
            },
            conversionsChartTooltip: {
                visible: false
            },
            assetChartTooltip: {
                visible: false
            },
            ads_currentTooltipTarget: null,
            ads_tooltipTimer: null,
            mouseX: 0,
            mouseY: 0,

            sidebarGroups: {
                insights: false,
                campaigns: true,
                assets: true
            },
            statusMenuOptions: [
                { state: 'Enabled', label: 'Enable' },
                { state: 'Paused', label: 'Pause' },
                { state: 'Removed', label: 'Remove' }
            ],
            account: {
                id: '1124-4-mcc',
                phone: '172-135-6148',
                email: 'nwq0822@gmail.com',
                name: 'reillymalvina309@gmail.com'
            },
            rawData: [],
            adAssetData: [],
            data: {
                dateRange: {
                    start: '2026-04-11',
                    end: '2026-05-08',
                    label: 'Apr 11 - May 8, 2026'
                },
                campaigns: [],
                adGroupTemplate: {
                    id: 'adgroup-1',
                    adGroup: 'Ad group 1',
                    targetCpa: '$20.00'
                },
                assets: [],
                assetSummary: {
                    headlines: '3/5',
                    descriptions: '3/5',
                    images: '10/20',
                    videos: '0/20'
                },
                assetSummaryProgress:[0.6,0.6,0.5,0],
            },
            floatingAddIsFixed: false
        };
    },
    computed: {
        filteredRawData() {
            if (!this.startDate || !this.endDate) return this.rawData;

            const start = this.parseLocalDate(this.startDate);
            const end = this.parseLocalDate(this.endDate);
            if (!start || !end) return this.rawData;

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            return this.rawData.filter(row => {
                const rowDate = this.parseLocalDate(row.date);
                if (!rowDate) return false;
                return rowDate >= start && rowDate <= end;
            });
        },
        campaignRows() {
            return this.data.campaigns
                .filter(campaign => !campaign.isTotal && !campaign.isRemoved)
                .slice()
                .sort((left, right) => left.campaign.localeCompare(right.campaign, 'en', { numeric: true }));
        },
        adGroupRows() {
            const campaignName = this.selectedCampaignId || (this.selectedCampaign ? this.selectedCampaign.campaign : '') || '';
            if (!campaignName || !this.rawData.length) return [];
            const filtered = this.filteredRawData.filter(row => row.campaign === campaignName);
            return this.mergeAdGroupsBy(filtered);
        },
        adGroupTotal() {
            return this.adGroupRows.reduce((acc, row) => {
                acc.Conversions += safeNumber(row.Conversions);
                acc.cost += safeNumber(row.cost);
                acc.installs += safeNumber(row.installs);
                acc.inAppActions += safeNumber(row.inAppActions);
                acc.impressions += safeNumber(row.impressions);
                acc.clicks += safeNumber(row.clicks);
                acc.ParticipatedInAppActions += safeNumber(row.ParticipatedInAppActions);
                acc.ViewThroughConv += safeNumber(row.ViewThroughConv);
                acc.CostPerConv = acc.Conversions ? acc.cost / acc.Conversions : 0;
                acc.costPerInstall = acc.installs ? acc.cost / acc.installs : 0;
                acc.costPerInAppActions = acc.inAppActions ? acc.cost / acc.inAppActions : 0;
                acc.CostPerParticipatedInAppAction = acc.ParticipatedInAppActions ? acc.cost / acc.ParticipatedInAppActions : 0;
                acc.ConvRate = acc.installs ? acc.Conversions / acc.installs : 0;
                return acc;
            }, { Conversions: 0, cost: 0, installs: 0, inAppActions: 0, impressions: 0, clicks: 0, ParticipatedInAppActions: 0, ViewThroughConv: 0, CostPerConv: 0, costPerInstall: 0, costPerInAppActions: 0, CostPerParticipatedInAppAction: 0, ConvRate: 0 });
        },
        selectedCampaign() {
            const rows = this.campaignRows.length
                ? this.campaignRows
                : (this.pageMode === 'campaigns' ? [] : this.mergeCampaignsBy(this.rawData));
            if (!rows.length) return null;
            return rows.find(campaign => campaign.campaign === this.selectedCampaignId) || rows[0];
        },
        adGroup() {
            return this.data.adGroupTemplate;
        },
        campaignSelectorLabel() {
            return this.pageMode === 'campaigns' ? `Campaigns (${this.campaignRows.length})` : 'Campaign';
        },
        campaignQuery() {
            return this.selectedCampaign ? `campaignId=${encodeURIComponent(this.selectedCampaign.campaign)}` : '';
        },
        adGroupsHref() {
            return this.campaignQuery ? `/aw/adgroups?${this.campaignQuery}` : '/aw/adgroups';
        },
        adAssetsHref() {
            const campaign = this.campaignQuery ? `${this.campaignQuery}&` : '';
            return `/aw/adassets?${campaign}adGroupId=${encodeURIComponent(this.selectedAdGroupId)}`;
        },
        pageTitle() {
            if (this.pageMode === 'adassets') return 'Ad assets';
            if (this.pageMode === 'adgroups') return 'Ad groups';
            if (this.pageMode === 'reporteditor') return 'Report editor';
            if (this.pageMode === 'overview') return 'Overview';
            return 'Campaigns';
        },
        totals() {
            const result = this.campaignRows.reduce((acc, campaign) => {
                acc.cost += safeNumber(campaign.cost);
                acc.installs += safeNumber(campaign.installs);
                acc.inAppActions += safeNumber(campaign.inAppActions);
                acc.impressions += safeNumber(campaign.impressions);
                acc.clicks += safeNumber(campaign.clicks);
                acc.conversions += safeNumber(campaign.Conversions || campaign.conversions);
                acc.viewThroughConv += safeNumber(campaign.ViewThroughConv || campaign.viewThroughConv);
                return acc;
            }, {
                cost: 0,
                installs: 0,
                inAppActions: 0,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                viewThroughConv: 0,
                ctr: 0
            });
            result.ctr = result.impressions ? (result.clicks / result.impressions) * 100 : 0;
            return result;
        },
        selectedCost() {
            return this.selectedCampaign ? safeNumber(this.selectedCampaign.cost) : 0;
        },
        selectedConversions() {
            return this.selectedCampaign ? safeNumber(this.selectedCampaign.Conversions || this.selectedCampaign.conversions) : 0;
        },
        selectedCostPerInstall() {
            return this.selectedCampaign ? safeNumber(this.selectedCampaign.costPerInstall) : 0;
        },
        selectedCostPerInAppAction() {
            return this.selectedCampaign ? safeNumber(this.selectedCampaign.costPerInAppAction) : 0;
        },
        selectedCostPerConv() {
            if (!this.selectedConversions) return 0;
            return this.selectedCost / this.selectedConversions;
        },
        metricCards() {
            if (this.pageMode === 'adgroups') {
                return [
                    { label: 'Conversions', value: this.formatNumber(this.selectedConversions, 2), delta: this.randomizedMetricDelta('adgroups-conversions', this.selectedConversions, 'fixed') },
                    { label: 'Cost', value: this.formatCurrency(this.selectedCost), delta: this.randomizedMetricDelta('adgroups-cost',  this.selectedCost, 'money') }
                ];
            }

            if (this.isRefreshing && this.refreshMode === 'full') {
                return [
                    { label: 'Avg. target CPA', value: '-', delta: '-' },
                    { label: 'Cost', value: this.formatCurrency(this.totals.cost), delta: this.randomizedMetricDelta('campaigns-cost',  this.totals.cost, 'money') },
                    { label: 'Conversions', value: this.formatNumber(this.totals.conversions, 2), delta: this.randomizedMetricDelta('campaigns-conversions', this.totals.conversions, 2, 'fixed') }
                ];
            }

            return [
                { label: 'Conversions', value: this.formatNumber(this.totals.conversions, 2), delta: this.randomizedMetricDelta('campaigns-conversions', this.totals.conversions, 'fixed') },
                { label: 'Cost', value: this.formatCurrency(this.totals.cost), delta: this.randomizedMetricDelta('campaigns-cost',  this.totals.cost, 'money') },
                { label: 'Impr.', value: this.formatNumber(this.totals.impressions), delta: this.randomizedMetricDelta('campaigns-impressions', this.totals.impressions, 'integer') },
                { label: 'Avg. target CPA', value: '—', delta: '-' }
            ];
        },
        conversionsChartValue() {
            return this.pageMode === 'adgroups'
                ? safeNumber(this.selectedConversions)
                : safeNumber(this.totals.conversions);
        },
        conversionsChartMax() {
            const value = this.conversionsChartValue;
            if (value <= 0) return 2;
            return niceChartCeiling(value * 1.25);
        },
        conversionsChartLabels() {
            const max = this.conversionsChartMax;
            return {
                max: this.fixed(max, 2),
                mid: this.fixed(max / 2, 2),
                min: this.fixed(0, 2)
            };
        },
        conversionsChartPoint() {
            const top = 30;
            const bottom = 154;
            const max = this.conversionsChartMax;
            const value = Math.min(this.conversionsChartValue, max);
            const ratio = max > 0 ? value / max : 0;
            return {
                x: 555,
                y: bottom - ratio * (bottom - top)
            };
        },
        conversionsChartPointMarkerStyle() {
            const xRatio = this.conversionsChartPoint.x / 1000;
            const yRatio = this.conversionsChartPoint.y / 180;
            return {
                left: `calc(${xRatio * 100}% + ${36 - (72 * xRatio)}px)`,
                top: `${18 + (yRatio * 170)}px`
            };
        },
        conversionsChartTooltipStyle() {
            const leftPercent = this.conversionsChartPoint.x / 10;
            const top = 18 + (this.conversionsChartPoint.y / 180) * 170;
            return {
                left: `${leftPercent}%`,
                top: `${top}px`
            };
        },
        conversionsChartTooltipDate() {
            if (!this.endDate) return '';
            return this.formatDateWithWeekday(this.endDate);
        },
        conversionsChartTooltipValue() {
            return this.formatNumber(this.conversionsChartValue, 2);
        },
        assetChartValue() {
            return safeNumber(this.adGroupTotal.Conversions) || this.selectedConversions;
        },
        assetChartMax() {
            const value = this.assetChartValue;
            if (value <= 0) return 2;
            return Math.max(2, Math.ceil((value * 1.45) / 20) * 20);
        },
        assetChartLabels() {
            const max = this.assetChartMax;
            return {
                max: this.fixed(max, 2),
                mid: this.fixed(max / 2, 2),
                min: this.fixed(0, 2)
            };
        },
        assetChartPoint() {
            const top = 30;
            const bottom = 154;
            const max = this.assetChartMax;
            const value = Math.min(this.assetChartValue, max);
            const ratio = max > 0 ? value / max : 0;
            return {
                x: 555,
                y: bottom - ratio * (bottom - top)
            };
        },
        assetChartPointMarkerStyle() {
            const xRatio = this.assetChartPoint.x / 1000;
            const yRatio = this.assetChartPoint.y / 180;
            return {
                left: `calc(${xRatio * 100}% + ${18 - (38 * xRatio)}px)`,
                top: `${28 + (yRatio * 168)}px`
            };
        },
        assetChartTooltipStyle() {
            const leftPercent = this.assetChartPoint.x / 10;
            const top = 28 + (this.assetChartPoint.y / 180) * 168;
            return {
                left: `${leftPercent}%`,
                top: `${top}px`
            };
        },
        assetChartTooltipDate() {
            if (!this.endDate) return '';
            return this.formatDateWithWeekday(this.endDate);
        },
        assetChartTooltipValue() {
            return this.formatNumber(this.assetChartValue, 2);
        },
        metricActions() {
            return [
                { icon: 'add_chart', label: 'Metrics' },
                { icon: 'tune', label: 'Adjust', badge: this.pageMode === 'adgroups' ? '2' : '3' },
                { icon: 'file_download', label: 'Download' },
                { icon: 'fullscreen', label: 'Expand' }
            ];
        },
        tableTools() {
            if (this.pageMode === 'adassets') {
                return [
                    { icon: 'segment', label: 'Segment' },
                    { icon: 'view_column', label: 'Columns' },
                    { icon: 'file_download', label: 'Download' },
                    { icon: 'fullscreen', label: 'Expand' }
                ];
            }
            return [
                { icon: 'search', label: 'Search' },
                { icon: 'segment', label: 'Segment' },
                { icon: 'view_column', label: 'Columns' },
                { icon: 'insert_chart', label: 'Reports' },
                { icon: 'file_download', label: 'Download' },
                { icon: 'fullscreen', label: 'Expand' },
                { icon: 'more_vert', label: 'More' }
            ];
        },
        selectedCampaignStatusClass() {
            if (!this.selectedCampaign) return '';
            return this.statusDotClass(this.getStatusFromRow(this.selectedCampaign));
        },
        selectedCampaignStateLabel() {
            if (!this.selectedCampaign) return '';
            const status = this.getStatusFromRow(this.selectedCampaign);
            return (status === 'Enabled' || status === 'Eligible') ? 'Enabled' : 'Paused';
        },
        selectedCampaignStatusText() {
            if (!this.selectedCampaign) return '';
            return this.selectedCampaign.Status || this.selectedCampaign.status || this.selectedCampaign.campaignStatus || '';
        },
        isSelectedCampaignProblem() {
            const text = this.selectedCampaignStatusText;
            if (!text) return false;
            return text.toLowerCase().includes('not') || text.toLowerCase().includes('paused') || text.toLowerCase().includes('disapproved') || text.toLowerCase().includes('limited');
        },
        assetRows() {
            if (!this.adAssetData.length) return [];
            const src = this.adGroupTotal;
            if (!src.clicks && !src.cost) return [];

            const campaignKey = this.selectedCampaignId || (this.selectedCampaign ? this.selectedCampaign.campaign : '') || 'default';
            let cached = null;
            try { cached = JSON.parse(sessionStorage.getItem(ASSET_RANDOM_CACHE_KEY + campaignKey)); } catch(e) {}

            // 验证缓存完整性：图片需要 randomNum + 5个字段系数 + 10个权重 + 10行独立系数，文本需要 6 行每行 5 个系数
            if (!cached ||
                !cached.imageRandom || !cached.imageFieldCoefs || cached.imageFieldCoefs.length !== 5 ||
                !cached.imageWeights || cached.imageWeights.length !== 10 ||
                !cached.imageRowCoefs || cached.imageRowCoefs.length !== 10 || cached.imageRowCoefs.some(r => r.length !== 5) ||
                !cached.textRowRandoms || cached.textRowRandoms.length !== 6 ||
                !cached.textRowCoefs || cached.textRowCoefs.length !== 6 || cached.textRowCoefs.some(r => r.length !== 5)) {

                // ====== 图片随机值 ======
                const imageRandom = 0.6 + Math.random() * 0.8;
                // 5 个字段各自的浮动系数（基于 randomNum ±0.9），用于算总计
                const imageFieldCoefs = Array.from({ length: 5 }, () => imageRandom + (Math.random() * 2 - 1) * 0.1);
                // 每张图片独立的5字段系数（±0.6浮动），使每张图的CTR等衍生指标差距更大
                const imageRowCoefs = Array.from({ length: 10 }, () =>
                    Array.from({ length: 5 }, () => imageRandom + (Math.random() * 2 - 1) * 0.6)
                );
                // 10 个权重：用幂律分布，大者越大小者越小，再归一化到和为1
                const rawWeights = Array.from({ length: 10 }, () => Math.pow(Math.random(), 2.5));
                const weightSum = rawWeights.reduce((a, b) => a + b, 0);
                const imageWeights = rawWeights.map(w => w / weightSum);

                // ====== 文本行随机值（headline+description 共6行）======
                const textRowRandoms = Array.from({ length: 6 }, () => 0.2 + Math.random() * 0.5);
                // 每行 5 个字段各自浮动系数（基于该行的 randomNumX ±0.5），拉大CTR差距
                const textRowCoefs = textRowRandoms.map(rx =>
                    Array.from({ length: 5 }, () => rx * (0.2 + Math.random() * 0.6))
                );

                cached = { imageRandom, imageFieldCoefs, imageRowCoefs, imageWeights, textRowRandoms, textRowCoefs };
                sessionStorage.setItem(ASSET_RANDOM_CACHE_KEY + campaignKey, JSON.stringify(cached));
            }

            const ifc = cached.imageFieldCoefs; // [clicksCoef, imprCoef, costCoef, installsCoef, inAppActionsCoef]

            // 图片总计 = 聚合值 × 各自保存的浮动系数
            const imgTotalClicks = src.clicks * ifc[0];
            const imgTotalImpr = src.impressions * ifc[1];
            const imgTotalCost = src.cost * ifc[2];
            const imgTotalInstalls = src.installs * ifc[3];
            const imgTotalInAppActions = src.inAppActions * ifc[4];

            const images = [];
            const headlines = [];
            const descriptions = [];
            let imgIdx = 0;
            let textIdx = 0;

            for (const asset of this.adAssetData) {
                if (asset.assetType === 'Image') {
                    const w = cached.imageWeights[imgIdx];
                    const rc = cached.imageRowCoefs[imgIdx]; // 该行独立的5字段系数
                    images.push({
                        ...asset,
                        clicks: Math.max(1, Math.round(imgTotalClicks * rc[0] * w)),
                        impressions: Math.max(1, Math.round(imgTotalImpr * rc[1] * w)),
                        cost: +(Math.max(0.01, imgTotalCost * rc[2] * w)).toFixed(2),
                        installs: Math.max(1, Math.round(imgTotalInstalls * rc[3] * w)),
                        inAppActions: Math.max(1, Math.round(imgTotalInAppActions * rc[4] * w)),
                        ctr: 0, costPerInstall: 0, costPerInAppAction: 0
                    });
                    imgIdx++;
                } else if (asset.assetType === 'Headline') {
                    const rx = cached.textRowRandoms[textIdx];
                    const rc = cached.textRowCoefs[textIdx]; // [clicksCoef, imprCoef, costCoef, installsCoef, inAppActionsCoef]
                    headlines.push({
                        ...asset,
                        clicks: Math.max(1, Math.round(src.clicks * rc[0])),
                        impressions: Math.max(1, Math.round(src.impressions * rc[1])),
                        cost: +(Math.max(0.01, src.cost * rc[2])).toFixed(2),
                        installs: Math.max(1, Math.round(src.installs * rc[3])),
                        inAppActions: Math.max(1, Math.round(src.inAppActions * rc[4])),
                        ctr: 0, costPerInstall: 0, costPerInAppAction: 0
                    });
                    textIdx++;
                } else {
                    const rx = cached.textRowRandoms[textIdx];
                    const rc = cached.textRowCoefs[textIdx];
                    descriptions.push({
                        ...asset,
                        clicks: Math.max(1, Math.round(src.clicks * rc[0])),
                        impressions: Math.max(1, Math.round(src.impressions * rc[1])),
                        cost: +(Math.max(0.01, src.cost * rc[2])).toFixed(2),
                        installs: Math.max(1, Math.round(src.installs * rc[3])),
                        inAppActions: Math.max(1, Math.round(src.inAppActions * rc[4])),
                        ctr: 0, costPerInstall: 0, costPerInAppAction: 0
                    });
                    textIdx++;
                }
            }

            // 计算衍生字段
            const all = [...images, ...headlines, ...descriptions];
            for (const row of all) {
                row.ctr = row.impressions ? (row.clicks / row.impressions) * 100 : 0;
                row.costPerInstall = row.installs ? row.cost / row.installs : 0;
                row.costPerInAppAction = row.inAppActions ? row.cost / row.inAppActions : 0;
            }

            return all.sort((left, right) => {
                let diff = 0;

                if (this.assetSortKey === 'assetType') {
                    diff = String(left.assetType || '').localeCompare(String(right.assetType || ''), 'en', {
                        numeric: true,
                        sensitivity: 'base'
                    });
                } else {
                    diff = safeNumber(left.cost) - safeNumber(right.cost);
                }

                if (diff !== 0) {
                    return this.assetSortDirection === 'asc' ? diff : -diff;
                }

                return String(left.asset || '').localeCompare(String(right.asset || ''), 'en', { numeric: true });
            });
        },
        assetCostSortDirection() {
            return this.assetSortKey === 'cost' ? this.assetSortDirection : 'desc';
        },
        assetTypeSortDirection() {
            return this.assetSortKey === 'assetType' ? this.assetSortDirection : 'asc';
        },
        activeRows() {
            if (this.pageMode === 'adassets') return this.assetRows;
            if (this.pageMode === 'adgroups') return this.adGroupRows;
            return this.campaignRows;
        },
        totalPages() {
            return Math.max(1, Math.ceil(this.activeRows.length / this.pageSize));
        },
        displayPage() {
            return Math.min(this.currentPage, this.totalPages);
        },
        pageStartIndex() {
            return (this.displayPage - 1) * this.pageSize;
        },
        paginatedCampaignRows() {
            return this.campaignRows.slice(this.pageStartIndex, this.pageStartIndex + this.pageSize);
        },
        paginatedAdGroupRows() {
            return this.adGroupRows.slice(this.pageStartIndex, this.pageStartIndex + this.pageSize);
        },
        paginatedAssetRows() {
            return this.assetRows.slice(this.pageStartIndex, this.pageStartIndex + this.pageSize);
        },
        paginationText() {
            const totalRows = this.activeRows.length;
            if (!totalRows) return '0 - 0 of 0';
            const start = this.pageStartIndex + 1;
            const end = Math.min(this.pageStartIndex + this.pageSize, totalRows);
            return `${start} - ${end} of ${totalRows}`;
        },
        canGoPreviousPage() {
            return this.displayPage > 1;
        },
        canGoNextPage() {
            return this.displayPage < this.totalPages;
        },
        calendarMonths() {
            const months = [];
            const baseDate = this.calendarMonth;
            for (let i = -6; i < 6; i++) {
                const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
                const calendarData = this.getCalendarWeeks(targetDate);
                months.push({
                    date: targetDate,
                    monthYear: targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase(),
                    weeks: calendarData.weeks,
                    firstWeekCurrentMonthDays: calendarData.firstWeekCurrentMonthDays,
                    showTitleInline: calendarData.firstWeekCurrentMonthDays < 4
                });
            }
            return months;
        },
        calendarMonthYear() {
            return this.calendarMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
        },
        formattedStartDate() {
            if (!this.startDate) return '';
            return this.formatDate(this.startDate);
        },
        formattedEndDate() {
            if (!this.endDate) return '';
            return this.formatDate(this.endDate);
        },
        formattedDraftStartDate() {
            if (!this.draftStartDate) return '';
            return this.formatDate(this.draftStartDate);
        },
        formattedDraftEndDate() {
            if (!this.draftEndDate) return '';
            return this.formatDate(this.draftEndDate);
        },
        dateRangeLabel() {
            if (!this.formattedStartDate || !this.formattedEndDate) return '';
            return this.formattedStartDate === this.formattedEndDate
                ? this.formattedStartDate
                : `${this.formattedStartDate} - ${this.formattedEndDate}`;
        },
        dropdownStyle() {
            if (!this.showDatePicker || !this.$refs.dateSelectRef) return {};
            this.datePickerPositionTick;
            const rect = this.$refs.dateSelectRef.getBoundingClientRect();
            const pickerWidth = 508;
            const left = Math.max(16, Math.min(rect.left, window.innerWidth - pickerWidth - 16));
            return {
                position: 'fixed',
                top: `${rect.bottom + 8}px`,
                left: `${left}px`,
                zIndex: '10000'
            };
        }
    },
    
    methods: {
        async reloadData() {
            if (this.isRefreshing) return;
            this.showDatePicker = false;
            this.dropdown = '';
            this.isNotificationsOpen = false;

            await this.runGoogleAdsDataLoad();
        },
        async runGoogleAdsDataLoad(options = {}) {
            if (this.isRefreshing) return;
            const mode = options.mode === 'soft' ? 'soft' : 'full';
            const minimumDelay = mode === 'soft' ? 320 : 1400;
            this.refreshMode = mode;
            this.isRefreshing = true;
            this.isSoftRefreshing = mode === 'soft';

            try {
                await this.$nextTick();
                await Promise.all([
                    this.loadData(),
                    new Promise(resolve => setTimeout(resolve, minimumDelay))
                ]);
                this.currentPage = 1;
            } finally {
                this.isRefreshing = false;
                this.isSoftRefreshing = false;
                this.refreshMode = 'full';
            }
        },
        async loadData() {
            try {
                const response = await fetch('/assets/tableData.json', { cache: 'no-store' });
                const rawData = await response.json();
                this.rawData = rawData;
                this.refreshCampaignData();
                if (!this.selectedCampaignId && this.pageMode !== 'campaigns' && this.campaignRows.length) {
                    this.selectedCampaignId = this.campaignRows[0].campaign;
                }
                // 加载 adassets 资源
                await this.loadAdAssets();
            } catch (error) {
                console.error('Unable to load Google Ads data', error);
            }
        },
        async loadAdAssets() {
            try {
                const res = await fetch('/api/adassets/plan1', { cache: 'no-store' });
                const json = await res.json();
                this.adAssetData = json.assets || [];
            } catch (error) {
                console.error('Unable to load ad assets', error);
            }
        },
        hideGoogleAdsBootLoader() {
            const loader = document.getElementById('google-ads-boot-loader');
            if (!loader) return;

            const startedAt = Number(window.__googleAdsBootStartedAt || 0);
            const elapsed = startedAt ? performance.now() - startedAt : 0;
            const remaining = Math.max(0, 1000 - elapsed);

            window.setTimeout(() => {
                loader.classList.add('is-hidden');
                window.setTimeout(() => loader.remove(), 220);
            }, remaining);
        },
        toggleAssetSort(key) {
            if (this.assetSortKey === key) {
                this.assetSortDirection = this.assetSortDirection === 'asc' ? 'desc' : 'asc';
                return;
            }

            this.assetSortKey = key;
            this.assetSortDirection = key === 'assetType' ? 'asc' : 'desc';
        },
        formatCurrency(value) {
            const numericValue = Number(value);
            if (!Number.isFinite(numericValue) || numericValue === 0) return '$0.00';
            const fixedValue = numericValue.toFixed(2);
            const parts = fixedValue.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return '$' + parts.join('.');
        },
        formatNumber(value, decimals = 0) {
            const numericValue = Number(value);
            const fractionDigits = Math.max(0, Number.isInteger(decimals) ? decimals : Number(decimals) || 0);
            if (!Number.isFinite(numericValue) || numericValue === 0) {
                return (0).toLocaleString('en-US', {
                    minimumFractionDigits: fractionDigits,
                    maximumFractionDigits: fractionDigits
                });
            }
            return numericValue.toLocaleString('en-US', {
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits
            });
        },
        toggleAssetCostSort() {
            this.toggleAssetSort('cost');
        },
        scheduleDatePickerReposition() {
            this.datePickerPositionTick += 1;
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(() => {
                    this.datePickerPositionTick += 1;
                });
            }
            [120, 260].forEach(delay => {
                window.setTimeout(() => {
                    this.datePickerPositionTick += 1;
                }, delay);
            });
        },
        refreshCampaignData() {
            this.data = {
                ...this.data,
                dateRange: {
                    start: this.formatIsoDate(this.startDate),
                    end: this.formatIsoDate(this.endDate),
                    label: this.dateRangeLabel
                },
                campaigns: this.mergeCampaignsBy(this.filteredRawData)
            };
            this.applyCampaignStatusOverrides();
        },
        parseLocalDate(value) {
            if (!value) return null;

            if (value instanceof Date) {
                if (Number.isNaN(value.getTime())) return null;
                return new Date(value.getFullYear(), value.getMonth(), value.getDate());
            }

            const text = String(value).trim();
            const dateOnlyMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (dateOnlyMatch) {
                return new Date(
                    Number(dateOnlyMatch[1]),
                    Number(dateOnlyMatch[2]) - 1,
                    Number(dateOnlyMatch[3])
                );
            }

            const parsed = new Date(text);
            if (Number.isNaN(parsed.getTime())) return null;
            return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        },
        formatDate(date) {
            const d = this.parseLocalDate(date);
            if (!d) return '';
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        },
        formatDateWithWeekday(date) {
            const d = this.parseLocalDate(date);
            if (!d) return '';
            const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return `${weekdayNames[d.getDay()]}, ${this.formatDate(d)}`;
        },
        formatIsoDate(date) {
            const d = this.parseLocalDate(date);
            if (!d) return '';
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${d.getFullYear()}-${month}-${day}`;
        },
        getDateOptionLabel(option) {
            const labels = {
                today: 'Today',
                yesterday: 'Yesterday',
                thisWeekSunSat: 'This week (Sun - Today)',
                thisWeekMonSun: 'This week (Mon - Today)',
                last7Days: 'Last 7 days (up to yesterday)',
                lastWeekSunSat: 'Last week (Sun - Sat)',
                lastWeekMonSun: 'Last week (Mon - Sun)',
                lastBusinessWeek: 'Last business week (Mon - Fri)',
                last14Days: 'Last 14 days (up to yesterday)',
                thisMonth: 'This month',
                last30Days: 'Last 30 days',
                lastMonth: 'Last month',
                allTime: 'All time',
                custom: 'Custom'
            };
            return labels[option] || 'Custom';
        },
        getCalendarWeeks(targetDate) {
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDay = firstDay.getDay();
            const weeks = [];
            let currentWeek = [];
            let firstWeekCurrentMonthDays = 0;

            for (let i = 0; i < startDay; i++) {
                currentWeek.push({ date: new Date(year, month, -startDay + i + 1), isCurrentMonth: false });
            }

            for (let i = 1; i <= lastDay.getDate(); i++) {
                currentWeek.push({ date: new Date(year, month, i), isCurrentMonth: true });
                if (weeks.length === 0) firstWeekCurrentMonthDays++;
                if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }
            }

            if (currentWeek.length > 0) {
                for (let i = 1; currentWeek.length < 7; i++) {
                    currentWeek.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
                }
                weeks.push(currentWeek);
            }

            return { weeks, firstWeekCurrentMonthDays };
        },
        isSameDay(date1, date2) {
            const d1 = this.parseLocalDate(date1);
            const d2 = this.parseLocalDate(date2);
            if (!d1 || !d2) return false;
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        },
        isInRange(date) {
            if (!this.draftStartDate || !this.draftEndDate) return false;
            const d = this.parseLocalDate(date);
            const start = this.parseLocalDate(this.draftStartDate);
            const end = this.parseLocalDate(this.draftEndDate);
            if (!d || !start || !end) return false;
            return d >= start && d <= end;
        },
        toggleDatePicker(event) {
            if (event) event.stopPropagation();
            if (this.showDatePicker) {
                this.cancelDateRange();
                return;
            }

            this.dropdown = '';
            this.showDatePicker = true;
            this.resetDraftDateRange();
            this.calendarMonth = this.draftStartDate ? new Date(this.draftStartDate) : new Date();
            this.$nextTick(() => this.scrollToSelectedDate());
        },
        scrollToSelectedDate() {
            if (!this.draftStartDate) return;
            const selectedDayElement = document.querySelector('.date-picker-dropdown .calendar-day.selected');
            if (selectedDayElement) {
                selectedDayElement.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        },
        handleClickOutside(event) {
            if (!this.showDatePicker) return;
            const datePickerEl = document.querySelector('.date-picker-dropdown');
            const dateSelectEl = this.$refs.dateSelectRef;
            if (datePickerEl && !datePickerEl.contains(event.target) &&
                dateSelectEl && !dateSelectEl.contains(event.target)) {
                this.cancelDateRange();
            }
        },
        selectDateOption(option) {
            this.selectedDateOption = option;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            switch (option) {
                case 'today':
                    this.draftStartDate = new Date(today);
                    this.draftEndDate = new Date(today);
                    break;
                case 'yesterday': {
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    this.draftStartDate = new Date(yesterday);
                    this.draftEndDate = new Date(yesterday);
                    break;
                }
                case 'thisWeekSunSat': {
                    const start = new Date(today);
                    start.setDate(start.getDate() - start.getDay());
                    this.draftStartDate = start;
                    this.draftEndDate = new Date(today);
                    break;
                }
                case 'thisWeekMonSun': {
                    const start = new Date(today);
                    const day = start.getDay();
                    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
                    this.draftStartDate = start;
                    this.draftEndDate = new Date(today);
                    break;
                }
                case 'last7Days': {
                    const start = new Date(today);
                    start.setDate(start.getDate() - 7);
                    const end = new Date(today);
                    end.setDate(end.getDate() - 1);
                    this.draftStartDate = start;
                    this.draftEndDate = end;
                    break;
                }
                case 'lastWeekSunSat': {
                    const start = new Date(today);
                    const diff = start.getDay() === 0 ? 7 : start.getDay();
                    start.setDate(start.getDate() - diff);
                    const end = new Date(start);
                    end.setDate(end.getDate() + 6);
                    this.draftStartDate = start;
                    this.draftEndDate = end;
                    break;
                }
                case 'lastWeekMonSun': {
                    const start = new Date(today);
                    const day = start.getDay();
                    start.setDate(start.getDate() - (day === 1 ? 7 : (day === 0 ? 6 : day - 1)));
                    const end = new Date(start);
                    end.setDate(end.getDate() + 6);
                    this.draftStartDate = start;
                    this.draftEndDate = end;
                    break;
                }
                case 'lastBusinessWeek': {
                    const start = new Date(today);
                    const day = start.getDay();
                    start.setDate(start.getDate() - (day === 1 ? 7 : (day === 0 ? 6 : day - 1)));
                    const end = new Date(start);
                    end.setDate(end.getDate() + 4);
                    this.draftStartDate = start;
                    this.draftEndDate = end;
                    break;
                }
                case 'last14Days': {
                    const start = new Date(today);
                    start.setDate(start.getDate() - 14);
                    const end = new Date(today);
                    end.setDate(end.getDate() - 1);
                    this.draftStartDate = start;
                    this.draftEndDate = end;
                    break;
                }
                case 'thisMonth':
                    this.draftStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    this.draftEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    break;
                case 'last30Days': {
                    const start = new Date(today);
                    start.setDate(start.getDate() - 29);
                    this.draftStartDate = start;
                    this.draftEndDate = new Date(today);
                    break;
                }
                case 'lastMonth':
                    this.draftStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    this.draftEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
                    break;
                case 'allTime':
                    this.draftStartDate = new Date(2000, 0, 1);
                    this.draftEndDate = new Date(today);
                    break;
                case 'custom':
                    if (!this.draftStartDate || !this.draftEndDate) {
                        this.resetDraftDateRange();
                    }
                    break;
            }

            if (this.draftStartDate) {
                this.calendarMonth = new Date(this.draftStartDate);
            }
            this.$nextTick(() => this.scrollToSelectedDate());
        },
        selectCalendarDate(date) {
            if (this.selectingStartDate) {
                this.draftStartDate = new Date(date);
                this.draftEndDate = null;
                this.selectingStartDate = false;
            } else {
                if (date < this.draftStartDate) {
                    this.draftEndDate = new Date(this.draftStartDate);
                    this.draftStartDate = new Date(date);
                } else {
                    this.draftEndDate = new Date(date);
                }
                this.selectingStartDate = true;
            }
            this.selectedDateOption = 'custom';
            this.calendarMonth = new Date(date);
        },
        selectStartDate() {
            this.selectingStartDate = true;
            this.selectedDateOption = 'custom';
        },
        selectEndDate() {
            this.selectingStartDate = false;
            this.selectedDateOption = 'custom';
        },
        navigateMonth(direction) {
            this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + direction, 1);
        },
        cloneDate(date) {
            const parsed = this.parseLocalDate(date);
            return parsed ? new Date(parsed) : null;
        },
        resetDraftDateRange() {
            this.selectedDateOption = this.appliedDateOption;
            this.draftStartDate = this.cloneDate(this.startDate);
            this.draftEndDate = this.cloneDate(this.endDate);
            this.selectingStartDate = true;
        },
        async applyDateRange() {
            if (!this.draftStartDate || !this.draftEndDate) return;
            this.startDate = this.cloneDate(this.draftStartDate);
            this.endDate = this.cloneDate(this.draftEndDate);
            this.appliedDateOption = this.selectedDateOption;
            this.saveDateFilterState();
            this.showDatePicker = false;
            await this.runGoogleAdsDataLoad({ mode: 'soft' });
        },
        cancelDateRange() {
            this.resetDraftDateRange();
            this.showDatePicker = false;
        },
        applyQuickDateOption(option) {
            this.selectDateOption(option);
            return this.applyDateRange();
        },
        async shiftDateRange(direction) {
            const start = this.cloneDate(this.startDate);
            const end = this.cloneDate(this.endDate);
            if (!start || !end) return;
            const daySpan = Math.max(1, Math.round((end - start) / 86400000) + 1);
            start.setDate(start.getDate() + direction * daySpan);
            end.setDate(end.getDate() + direction * daySpan);
            this.startDate = start;
            this.endDate = end;
            this.appliedDateOption = 'custom';
            this.selectedDateOption = 'custom';
            this.saveDateFilterState();
            await this.runGoogleAdsDataLoad({ mode: 'soft' });
        },
        saveDateFilterState() {
            try {
                sessionStorage.setItem(DATE_FILTER_STORAGE_KEY, JSON.stringify({
                    storageVersion: DATE_FILTER_STORAGE_VERSION,
                    selectedDateOption: this.selectedDateOption,
                    appliedDateOption: this.appliedDateOption,
                    startDate: this.formatIsoDate(this.startDate),
                    endDate: this.formatIsoDate(this.endDate)
                }));
            } catch (error) {
            }
        },
        toggleDropdown(name) {
            if (name === 'view' && this.pageMode !== 'campaigns') {
                this.navigateToGoogleAdsRoute('/aw/campaigns');
                return;
            }
            this.showPageSizeDropdown = false;
            this.dropdown = this.dropdown === name ? '' : name;
        },
        toggleNavigation() {
            this.isNavCollapsed = !this.isNavCollapsed;
            localStorage.setItem('googleAdsNavCollapsed', String(this.isNavCollapsed));
        },
        isSidebarGroupOpen(groupName) {
            return Boolean(this.sidebarGroups[groupName]);
        },
        toggleSidebarGroup(groupName) {
            this.sidebarGroups = {
                ...this.sidebarGroups,
                [groupName]: !this.sidebarGroups[groupName]
            };
        },
        closeDropdown() {
            this.dropdown = '';
            this.showPageSizeDropdown = false;
        },
        togglePageSizeDropdown() {
            this.dropdown = '';
            this.showPageSizeDropdown = !this.showPageSizeDropdown;
        },
        setPageSize(size) {
            const nextSize = Number(size);
            if (!this.pageSizeOptions.includes(nextSize)) return;
            this.pageSize = nextSize;
            this.currentPage = 1;
            this.showPageSizeDropdown = false;
        },
        goToFirstPage() {
            this.currentPage = 1;
        },
        goToPreviousPage() {
            if (this.canGoPreviousPage) {
                this.currentPage = this.displayPage - 1;
            }
        },
        goToNextPage() {
            if (this.canGoNextPage) {
                this.currentPage = this.displayPage + 1;
            }
        },
        goToLastPage() {
            this.currentPage = this.totalPages;
        },
        statusDropdownName(campaignId) {
            return `campaign-status-${campaignId}`;
        },
        toggleStatusMenu(campaignId) {
            const dropdownName = this.statusDropdownName(campaignId);
            this.dropdown = this.dropdown === dropdownName ? '' : dropdownName;
        },
        campaignStatusText(status) {
            return status === 'Enabled' ? 'Eligible' : status;
        },
        applyCampaignStatus(campaign, status) {
            campaign.campaignStatus = status;
            campaign.status = this.campaignStatusText(status);
            campaign.Status = this.campaignStatusText(status);
            campaign.isRemoved = status === 'Removed';
        },
        applyCampaignStatusOverrides() {
            if (!Array.isArray(this.data.campaigns)) return;
            this.data.campaigns.forEach(campaign => {
                const status = this.campaignStatusOverrides[campaign.campaign];
                if (status) {
                    this.applyCampaignStatus(campaign, status);
                }
            });
        },
        setCampaignStatus(campaign, status) {
            this.applyCampaignStatus(campaign, status);
            this.campaignStatusOverrides = {
                ...this.campaignStatusOverrides,
                [campaign.campaign]: status
            };
            localStorage.setItem(CAMPAIGN_STATUS_STORAGE_KEY, JSON.stringify(this.campaignStatusOverrides));
            this.dropdown = '';
        },
        campaignHref(id) {
            return `/aw/adgroups?campaignId=${encodeURIComponent(id)}`;
        },
        statusDotClass(status) {
            if (status === 'Enabled') return 'enabled';
            if (status === 'Removed') return 'removed';
            if (status === 'Eligible') return 'enabled';
            return 'paused';
        },
        getStatusFromRow(campaign) {
            return campaign.Status || campaign.status || campaign.campaignStatus || 'Eligible';
        },
        mergeCampaignsBy(rawData) {
            const campaignMap = new Map();

            for (const row of rawData) {
                const key = row.campaign;
                if (!campaignMap.has(key)) {
                    campaignMap.set(key, {
                        id: key,
                        campaign: key,
                        campaignId: row.campaignId,
                        Buget: row.Buget || 0,
                        Status: row.Status || 'Eligible',
                        Account: row.Account || '',
                        account: row.Account || '',
                        OptimizationScore: row.OptimizationScore,
                        CampaignType: row.CampaignType || 'App',
                        campaignType: row.CampaignType || 'App',
                        costPerInstall: 0,
                        costPerInAppActions: 0,
                        costPerInAppAction: 0,
                        ViewThroughConv: 0,
                        impressions: 0,
                        clicks: 0,
                        installs: 0,
                        inAppActions: 0,
                        ParticipatedInAppActions: 0,
                        cost: 0,
                        CostPerParticipatedInAppAction: 0,
                        ConvRate: 0,
                        Conversions: 0,
                        CostPerConv: 0,
                        isTotal: false,
                        isRemoved: false
                    });
                }

                const merged = campaignMap.get(key);
                merged.impressions += safeNumber(row.impressions);
                merged.clicks += safeNumber(row.clicks);
                merged.installs += safeNumber(row.installs);
                merged.inAppActions += safeNumber(row.inAppActions);
                merged.ParticipatedInAppActions += safeNumber(row.ParticipatedInAppActions || row.ParticlpatedInAppActions);
                merged.cost += safeNumber(row.cost);
                merged.ViewThroughConv += safeNumber(row.ViewThroughConv || row.viewThroughConv);
                merged.Conversions += safeNumber(row.Conversions);

                // 汇总后计算衍生字段
                merged.costPerInstall = merged.installs ? merged.cost / merged.installs : 0;
                merged.costPerInAppActions = merged.inAppActions ? merged.cost / merged.inAppActions : 0;
                merged.costPerInAppAction = merged.costPerInAppActions;
                merged.CostPerParticipatedInAppAction = merged.ParticipatedInAppActions ? merged.cost / merged.ParticipatedInAppActions : 0;
                merged.ConvRate = merged.installs ? merged.Conversions / merged.installs : 0;
                merged.CostPerConv = merged.Conversions ? merged.cost / merged.Conversions : 0;
            }

            return Array.from(campaignMap.values());
        },
        mergeAdGroupsBy(rawData) {
            const adGroupMap = new Map();

            for (const row of rawData) {
                const key = row.AdGroup;
                if (!adGroupMap.has(key)) {
                    adGroupMap.set(key, {
                        id: `adgroup-${adGroupMap.size + 1}`,
                        adGroup: key,
                        Status: row.Status || 'Eligible',
                        TargetCPA: row.TargetCPA || 0,
                        costPerInstall: 0,
                        costPerInAppActions: 0,
                        ViewThroughConv: 0,
                        installs: 0,
                        inAppActions: 0,
                        impressions: 0,
                        clicks: 0,
                        ParticipatedInAppActions: 0,
                        cost: 0,
                        CostPerParticipatedInAppAction: 0,
                        ConvRate: 0,
                        Conversions: 0,
                        CostPerConv: 0,
                        BrandInclusions: row.BrandInclusions || '-',
                        LocationsOfInterest: row.LocationsOfInterest || '-'
                    });
                }

                const merged = adGroupMap.get(key);
                merged.installs += safeNumber(row.installs);
                merged.inAppActions += safeNumber(row.inAppActions);
                merged.impressions += safeNumber(row.impressions);
                merged.clicks += safeNumber(row.clicks);
                merged.ParticipatedInAppActions += safeNumber(row.ParticipatedInAppActions || row.ParticlpatedInAppActions);
                merged.cost += safeNumber(row.cost);
                merged.Conversions += safeNumber(row.Conversions);

                // 汇总后计算衍生字段
                merged.costPerInstall = merged.installs ? merged.cost / merged.installs : 0;
                merged.costPerInAppActions = merged.inAppActions ? merged.cost / merged.inAppActions : 0;
                merged.CostPerParticipatedInAppAction = merged.ParticipatedInAppActions ? merged.cost / merged.ParticipatedInAppActions : 0;
                merged.ConvRate = merged.installs ? merged.Conversions / merged.installs : 0;
                merged.CostPerConv = merged.Conversions ? merged.cost / merged.Conversions : 0;
            }

            return Array.from(adGroupMap.values());
        },
        fixed(value, digits = 2) {
            return safeNumber(value).toFixed(digits);
        },
        metricInteger(value) {
            return String(Math.round(safeNumber(value)));
        },
        metricDeltaCacheKey(key, value) {
            return [
                key,
                this.formatIsoDate(this.startDate),
                this.formatIsoDate(this.endDate),
                safeNumber(value).toFixed(2)
            ].join('|');
        },
        metricDeltaRatio(key, value) {
            const cacheKey = this.metricDeltaCacheKey(key, value);
            if (!this.metricDeltaRatios[cacheKey]) {
                this.metricDeltaRatios[cacheKey] = 0.1 + Math.random() * 0.1;
            }
            return this.metricDeltaRatios[cacheKey];
        },
        randomizedMetricDelta(key, value, format = 'fixed') {
            const number = safeNumber(value);
            if (!number) return format === 'money' ? '$0.00' : '0';

            const delta = number * this.metricDeltaRatio(key, number);
            if (format === 'money') return this.formatCurrency(delta);
            if (format === 'integer') return this.formatNumber(delta);
            return this.formatNumber(delta, 2);
        },
        numberOrZero(value) {
            if (value === 0 || value === undefined) return '0';
            const number = safeNumber(value);
            return Number.isInteger(number) ? String(number) : number.toFixed(2);
        },
        money(value) {
            if (value === 0 || value === undefined) return '$0.00';
            return `$${safeNumber(value).toFixed(2)}`;
        },
        moneyOrDash(value) {
            const number = safeNumber(value);
            return number ? this.money(number) : '0.00';
        },
        percent(value) {
            if (value === 0 || value === undefined) return '0.00%';
            return `${safeNumber(value).toFixed(2)}%`;
        },
        dash(value) {
            if (value === null || value === undefined || value === '') return '-';
            return value;
        },
        openUnavailablePreview() {
            this.previewModal = { type: 'unavailable' };
        },
        openImagePreview(asset) {
            this.previewModal = { type: 'image', asset };
            this.isPreviewDetailsExpanded = true;
            this.isPreviewFullscreen = false;
        },
        closePreview() {
            this.previewModal = null;
            this.isPreviewFullscreen = false;
        },
        togglePreviewFullscreen() {
            this.isPreviewFullscreen = !this.isPreviewFullscreen;
        },
        togglePreviewDetails() {
            this.isPreviewDetailsExpanded = !this.isPreviewDetailsExpanded;
        },
        handleScroll() {
            const mainElement = document.querySelector('.ga-main');
            if (mainElement) {
                this.isContextBarHidden = mainElement.scrollTop > 50;
                
                // Manage floating add button sticky effect
                const tablePanel = document.querySelector('.ga-table-panel');
                if (tablePanel) {
                    const rect = tablePanel.getBoundingClientRect();
                    // Switch to fixed position when table panel top is above 155px threshold
                    this.floatingAddIsFixed = rect.top < 155;
                }
            }
            if (this.showDatePicker) {
                this.$nextTick(() => {
                    this.scheduleDatePickerReposition();
                });
            }
        },

        handleMouseMove(event) {
            // 实时记录鼠标位置
            this.mouseX = event.clientX
            this.mouseY = event.clientY
        },

        handleTooltipMouseOver(event) {

            // 找最近的带 tooltip 的元素
            const target = event.target.closest('[data-tooltip]')

            if (!target) {

                this.hideTooltip()

                return
            }

            // 避免同元素内部移动重复触发
            if (this.currentTooltipTarget === target) {
                return
            }

            this.currentTooltipTarget = target

// 清除旧定时器
        clearTimeout(this.tooltipTimer)

        // 延迟 0.25 秒
        this.tooltipTimer = setTimeout(() => {

            this.tooltip.text = target.dataset.tooltip

            // 鼠标位置
            this.tooltip.x = this.mouseX + 0

            // 贴近鼠标下方
            this.tooltip.y = this.mouseY + 21

            this.tooltip.visible = true

        }, 1000)
        },

        hideTooltip() {
            // 清除旧定时器
            clearTimeout(this.tooltipTimer)
            this.tooltip.visible = false
            this.currentTooltipTarget = null
        },

        showConversionsChartTooltip() {
            this.conversionsChartTooltip.visible = true;
        },

        hideConversionsChartTooltip() {
            this.conversionsChartTooltip.visible = false;
        },

        showAssetChartTooltip() {
            this.assetChartTooltip.visible = true;
        },

        hideAssetChartTooltip() {
            this.assetChartTooltip.visible = false;
        },

        toggleNotifications() {
            this.isNotificationsOpen = !this.isNotificationsOpen
        },
        startSoftPageTransition() {
            this.isSoftRefreshing = true;
            window.setTimeout(() => {
                this.isSoftRefreshing = false;
            }, 260);
        },
        syncGoogleAdsRoute(url, options = {}) {
            const routeBase = window.location.origin || 'https://localhost';
            const target = url instanceof URL ? url : new URL(url, routeBase);
            const mode = getPageModeFromPath(target.pathname);
            const campaignId = target.searchParams.get('campaignId');
            const adGroupId = target.searchParams.get('adGroupId');

            this.pageMode = mode;
            if (mode === 'campaigns') {
                this.selectedCampaignId = campaignId || '';
            } else {
                this.selectedCampaignId = campaignId || this.selectedCampaignId || (this.campaignRows[0] ? this.campaignRows[0].campaign : '');
            }
            this.selectedAdGroupId = adGroupId || this.selectedAdGroupId || 'adgroup-1';
            this.currentPage = 1;
            this.dropdown = '';
            this.showDatePicker = false;
            this.showPageSizeDropdown = false;
            this.isNotificationsOpen = false;

            if (options.push !== false) {
                window.history.pushState(null, '', `${target.pathname}${target.search}`);
            }

            this.$nextTick(() => {
                const main = document.querySelector('.ga-main');
                if (main) main.scrollTop = 0;
            });
        },
        navigateToGoogleAdsRoute(target, event) {
            if (event) event.preventDefault();
            this.startSoftPageTransition();
            this.syncGoogleAdsRoute(target);
        },
        handlePopState() {
            this.startSoftPageTransition();
            this.syncGoogleAdsRoute(`${window.location.pathname}${window.location.search || ''}`, { push: false });
        },
        switchPage(mode) {
            this.navigateToGoogleAdsRoute(`/aw/${mode}`);
        }
    },
    async mounted() {
        await this.loadData();
        this.hideGoogleAdsBootLoader();
        document.addEventListener('click', this.closeDropdown);
        document.addEventListener('click', this.handleClickOutside);
        window.addEventListener('popstate', this.handlePopState);

        // Add scroll listener for hiding context bar
        const mainElement = document.querySelector('.ga-main');
        if (mainElement) {
            mainElement.addEventListener('scroll', this.handleScroll);
        }
    },
    beforeUnmount() {
        document.removeEventListener('click', this.closeDropdown);
        document.removeEventListener('click', this.handleClickOutside);
        window.removeEventListener('popstate', this.handlePopState);

        // Remove scroll listener
        const mainElement = document.querySelector('.ga-main');
        if (mainElement) {
            mainElement.removeEventListener('scroll', this.handleScroll);
        }
    }
}).mount('#google-ads-app');
