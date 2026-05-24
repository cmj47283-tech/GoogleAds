const { createApp } = Vue;

createApp({
    data() {
        const defaultSelectedAccounts = ['680-644-5446', '921-239-0750'];
        let savedSelectedAccounts = defaultSelectedAccounts;
        try {
            const parsed = JSON.parse(localStorage.getItem('selectedAccounts') || 'null');
            if (Array.isArray(parsed) && parsed.every(account => typeof account === 'string')) {
                savedSelectedAccounts = parsed;
            }
        } catch (error) {
            savedSelectedAccounts = defaultSelectedAccounts;
        }
        const defaultColumnWidths = {
            campaign: 300,
            campaignId: 150,
            cost: 120,
            impressions: 120,
            clicks: 120,
            installs: 120,
            inAppActions: 140,
            costPerInstall: 140,
            costPerInAppActions: 180,
            ctr: 120,
        };
        let savedColumnWidths = {};
        try {
            savedColumnWidths = JSON.parse(localStorage.getItem('tableColumnWidths')) || {};
        } catch (error) {
            savedColumnWidths = {};
        }

        return {
            showRightPanel: true,
            showNotification: true,
            isRefreshing: false,
            isSaved: false,
            savedLabel: 'Unsaved',
            compareEnabled: false,
            isFirstNotificationsOpen: false,
            dateRange: '2025年12月9日 - 2026年3月24日',
            pageSize: 30,
            pageSizeOptions: [10, 30, 50, 100],
            showPageSizeDropdown: false,
            currentPage: 1,
            sortKey: 'campaign',
            sortOrderList: {
                campaign: 'desc',
                campaignId: 'desc',
                cost: 'desc',
                impressions: 'desc',
                clicks: 'desc',
                installs: 'desc',
                inAppActions: 'desc',
                costPerInstall: 'desc',
                costPerInAppActions: 'desc',
                ctr: 'desc',
            },
            columnOrder: [
                'campaign',
                'campaignId',
                'cost',
                'impressions',
                'clicks',
                'installs',
                'inAppActions',
                'costPerInstall',
                'costPerInAppActions',
                'ctr'
            ],
            columnCssVarNames: {
                campaign: 'campaign',
                campaignId: 'campaign-id',
                cost: 'cost',
                impressions: 'impressions',
                clicks: 'clicks',
                installs: 'installs',
                inAppActions: 'in-app-actions',
                costPerInstall: 'cost-per-install',
                costPerInAppActions: 'cost-per-in-app-actions',
                ctr: 'ctr'
            },
            columnWidths: {
                ...defaultColumnWidths,
                ...savedColumnWidths
            },
            columnMinWidths: {
                campaign: 180,
                campaignId: 100,
                cost: 88,
                impressions: 88,
                clicks: 88,
                installs: 96,
                inAppActions: 128,
                costPerInstall: 128,
                costPerInAppActions: 160,
                ctr: 88
            },
            columnResizeState: null,
            resizingColumn: '',
            selectAll: false,
            filterText: localStorage.getItem('filterText') || '',
                showFilterTagClose: false,
            isApplyJustNow: false,
            accountOptions: [
                { id: '680-644-5446', label: '680-644-5446' },
                { id: '921-239-0750', label: '921-239-0750' },
                { id: '403-118-9021', label: '403-118-9021' },
                { id: '517-882-1149', label: '517-882-1149' },
                { id: '208-771-3064', label: '208-771-3064' },
                { id: '735-420-8890', label: '735-420-8890' },
                { id: '144-590-6728', label: '144-590-6728' },
                { id: '856-301-4472', label: '856-301-4472' },
                { id: '612-947-0358', label: '612-947-0358' },
                { id: '309-685-2216', label: '309-685-2216' },
                { id: '774-230-9185', label: '774-230-9185' },
                { id: '458-109-7632', label: '458-109-7632' },
                { id: '681-204-5537', label: '681-204-5537' },
                { id: '924-517-1083', label: '924-517-1083' },
                { id: '410-882-7345', label: '410-882-7345' },
                { id: '538-671-2204', label: '538-671-2204' },
                { id: '219-305-8841', label: '219-305-8841' },
                { id: '742-198-6605', label: '742-198-6605' },
                { id: '155-462-9718', label: '155-462-9718' },
                { id: '863-714-5092', label: '863-714-5092' },
                { id: '624-950-1387', label: '624-950-1387' },
                { id: '318-476-2250', label: '318-476-2250' },
                { id: '781-233-9046', label: '781-233-9046' },
                { id: '469-120-7751', label: '469-120-7751' },
                { id: '592-814-3360', label: '592-814-3360' },
                { id: '847-661-2905', label: '847-661-2905' },
                { id: '275-309-4817', label: '275-309-4817' },
                { id: '930-584-7621', label: '930-584-7621' },
                { id: '514-273-9084', label: '514-273-9084' },
                { id: '688-145-3379', label: '688-145-3379' },
                { id: '742-860-1143', label: '742-860-1143' },
                { id: '391-552-6708', label: '391-552-6708' },
                { id: '820-471-9936', label: '820-471-9936' },
                { id: '467-908-1254', label: '467-908-1254' },
                { id: '703-214-6881', label: '703-214-6881' },
                { id: '159-842-3706', label: '159-842-3706' },
                { id: '936-501-2278', label: '936-501-2278' },
                { id: '581-760-9442', label: '581-760-9442' },
                { id: '264-118-5739', label: '264-118-5739' },
                { id: '875-349-6102', label: '875-349-6102' },
                { id: '428-693-8517', label: '428-693-8517' },
                { id: '617-250-4398', label: '617-250-4398' },
            ],
            selectedAccounts: savedSelectedAccounts,
            draftSelectedAccounts: [...savedSelectedAccounts],
            accountSearchText: '',
            showAccountPicker: false,
            accountText: localStorage.getItem('accountText') || `${savedSelectedAccounts.length} accounts`,
            campaigns: [
                {
                    campaign: '0254-PH Space Race-Kilay',
                    cost: 7.93,
                    impressions: 32,
                    clicks: 3,
                    installs: 0.78,
                    inAppActions: 0.38,
                    costPerInstall: 10.17,
                    costPerInAppActions: 20.87,
                    ctr: 9.38,
                    selected: false
                },
            ],
            showDatePicker: false,
            selectedDateOption: 'yesterday',
            appliedDateOption: 'yesterday',
            startDate: null,
            endDate: null,
            draftStartDate: null,
            draftEndDate: null,
            calendarMonth: new Date(),
            selectingStartDate: true,
            dateSelectRef: null,
            showCampaignIdColumn: localStorage.getItem('showCampaignIdColumn') !== 'false',
            lastHKeyPressAt: 0,
            // 账户选择器
            showAccountModal: false,
            accountFilterType: 'accounts',
            accountSearchQuery: '',
            modalSelectedAccounts: ['1124-4-mcc', '172-135-6148'],
            // Filter 选择器
            showFilterDropdown: false,
            filterSearchQuery: '',
            showFilterValueModal: false,
            selectedFilterName: '',
            filterValueInput: '',
            filterOperator: 'contains',
            campaignNameFilter: '',
            isFilterTagFocused: true,
            showCostDropdown: false,
            costDropdownStyle: {},
            // Filter condition modal
            showFilterConditionModal: false,
            filterConditionStyle: {},
            costFilterOperator: 'gt',
            costFilterValue: '',
            appliedCostFilterValue: '',
            appliedCostFilterOperator: 'gt',
            costFilterConditions: [],
            allFilters: [
                { id: 'ad-device-preference-type', name: 'Ad device preference type', description: '' },
                { id: 'ad-group', name: 'Ad group', description: '' },
                { id: 'ad-group-bid-strategy-type', name: 'Ad group bid strategy type', description: '' },
                { id: 'ad-group-name', name: 'Ad group name', description: '' },
                { id: 'ad-group-performance', name: 'Ad group performance', description: '' },
                { id: 'ad-group-state', name: 'Ad group state', description: '' },
                { id: 'ad-group-status', name: 'Ad group status', description: '' },
                { id: 'ad-group-type', name: 'Ad group type', description: '' },
                { id: 'ad-name', name: 'Ad name', description: '' },
                { id: 'ad-performance', name: 'Ad performance', description: '' },
                { id: 'ad-state', name: 'Ad state', description: '' },
                { id: 'ad-status', name: 'Ad status', description: '' },
                { id: 'ad-type', name: 'Ad type', description: '' },
                { id: 'app-asset-state', name: 'App asset state', description: '' },
                { id: 'app-asset-status', name: 'App asset status', description: '' },
                { id: 'app-asset-type', name: 'App asset type', description: '' },
                { id: 'approval-status', name: 'Approval status', description: '' },
                { id: 'campaign', name: 'Campaign', description: '' },
                { id: 'campaign-bid-strategy-type', name: 'Campaign bid strategy type', description: '' },
                { id: 'campaign-name', name: 'Campaign name', description: '' },
                { id: 'campaign-performance', name: 'Campaign performance', description: '' },
                { id: 'campaign-state', name: 'Campaign state', description: '' },
                { id: 'campaign-status', name: 'Campaign status', description: '' },
                { id: 'campaign-status-reasons', name: 'Campaign status reasons', description: '' },
                { id: 'campaign-subtype', name: 'Campaign subtype', description: '' },
                { id: 'campaign-type', name: 'Campaign type', description: '' },
                { id: 'eu-political-ads', name: 'EU political ads', description: '' },
                { id: 'network-with-search-partners', name: 'Network (with search partners)', description: '' },
                { id: 'sub-network-demand-gen', name: 'Sub-network (Demand Gen only)', description: '' }
            ],
            availableAccounts: [
                { id: '1124-4-mcc', name: '1124-4-mcc', phone: '172-135-6148' },
                { id: '172-135-6148', name: '172-135-6148', phone: '1124-4-mcc' },
                { id: '921-239-0750', name: '921-239-0750', phone: '921-239-0750' },
                { id: '382-941-0056', name: '382-941-0056', phone: '382-941-0056' },
                { id: '617-520-8394', name: '617-520-8394', phone: '617-520-8394' },
                { id: '105-772-4613', name: '105-772-4613', phone: '105-772-4613' },
                { id: '849-316-5582', name: '849-316-5582', phone: '849-316-5582' },
                { id: '294-087-1129', name: '294-087-1129', phone: '294-087-1129' },
                { id: '503-648-9271', name: '503-648-9271', phone: '503-648-9271' },
                { id: '771-403-2285', name: '771-403-2285', phone: '771-403-2285' },
                { id: '426-159-6740', name: '426-159-6740', phone: '426-159-6740' },
                { id: '938-251-7064', name: '938-251-7064', phone: '938-251-7064' }
            ]

        }
    },
    computed: {
        selectedAccountItems() {
            return this.accountOptions.filter(account => this.draftSelectedAccounts.includes(account.id));
        },
        filteredAccountOptions() {
            const search = this.accountSearchText.trim().toLowerCase();
            if (!search) return this.accountOptions;
            return this.accountOptions.filter(account => account.label.toLowerCase().includes(search));
        },
        isAllAccountsSelected() {
            return this.accountOptions.length > 0
                && this.accountOptions.every(account => this.draftSelectedAccounts.includes(account.id));
        },
        draftSelectedCount() {
            return this.filterSelectableAccountIds(this.draftSelectedAccounts).length;
        },
        filteredCampaigns() {
            let result = this.campaigns;
            if (this.startDate && this.endDate) {
                const start = this.parseLocalDate(this.startDate);
                const end = this.parseLocalDate(this.endDate);
                if (!start || !end) return [];
                // 使用字符串比较避免时区和时间部分的问题
                const startDateStr = this.formatDateForComparison(start);
                const endDateStr = this.formatDateForComparison(end);
                result = result.filter(campaign => {
                    const campaignDate = this.parseLocalDate(campaign.date);
                    if (!campaignDate) return false;
                    const campaignDateStr = this.formatDateForComparison(campaignDate);
                    return campaignDateStr >= startDateStr && campaignDateStr <= endDateStr;
                });
            }
            // Campaign name 过滤
            if (this.campaignNameFilter) {
                result = result.filter(campaign => {
                    const campaignName = campaign.campaign || '';
                    const filterValue = this.campaignNameFilter.toLowerCase();
                    const campaignNameLower = campaignName.toLowerCase();
                    switch (this.filterOperator) {
                        case 'is':
                            return campaignNameLower === filterValue;
                        case 'is not':
                            return campaignNameLower !== filterValue;
                        case 'contains':
                            return campaignNameLower.includes(filterValue);
                        case 'does not contain':
                            return !campaignNameLower.includes(filterValue);
                        default:
                            return true;
                    }
                });
            }
            // Cost 过滤 (使用已应用的值)
            if (this.appliedCostFilterValue !== '' && this.appliedCostFilterValue !== null && this.appliedCostFilterValue !== undefined) {
                const filterValue = parseFloat(this.appliedCostFilterValue);
                if (!isNaN(filterValue)) {
                    result = result.filter(campaign => {
                        const cost = campaign.cost || 0;
                        switch (this.appliedCostFilterOperator) {
                            case 'gt':
                                return cost > filterValue;
                            case 'lt':
                                return cost < filterValue;
                            case 'gte':
                                return cost >= filterValue;
                            case 'lte':
                                return cost <= filterValue;
                            case 'eq':
                                return cost === filterValue;
                            case 'neq':
                                return cost !== filterValue;
                            default:
                                return true;
                        }
                    });
                }
            }
            return this.aggregateCampaigns(result);
        },
        appliedCostFilterLabel() {
            if (this.appliedCostFilterValue === '' || this.appliedCostFilterValue === null || this.appliedCostFilterValue === undefined) {
                return '';
            }
            const operatorSymbol = {
                gt: '>',
                lt: '<',
                gte: '>=',
                lte: '<=',
                eq: '=',
                neq: '≠'
            }[this.appliedCostFilterOperator] || '>';
            return `${operatorSymbol}${this.appliedCostFilterValue}`;
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
        dropdownStyle() {
            if (!this.showDatePicker || !this.$refs.dateSelectRef) {
                return {};
            }
            const rect = this.$refs.dateSelectRef.getBoundingClientRect();
            return {
                position: 'fixed',
                top: rect.bottom - 80 + 'px',
                right: (150) + 'px',
                zIndex: '10000'
            };
        },
        sortedCampaigns() {
            if (!this.sortKey) {
                return this.filteredCampaigns;
            }
            const key = this.sortKey;
            const order = this.sortOrderList[key];
            return [...this.filteredCampaigns].sort((a, b) => {
                let aVal = a[key];
                let bVal = b[key];
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }
                if (aVal < bVal) return order === 'asc' ? -1 : 1;
                if (aVal > bVal) return order === 'asc' ? 1 : -1;
                return 0;
            });
        },
        paginatedCampaigns() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.sortedCampaigns.slice(start, end);
        },
        totalPages() {
            return Math.ceil(this.filteredCampaigns.length / this.pageSize);
        },
        showPagination() {
            return this.filteredCampaigns.length > this.pageSize;
        },
        startRow() {
            return (this.currentPage - 1) * this.pageSize + 1;
        },
        endRow() {
            return Math.min(this.currentPage * this.pageSize, this.filteredCampaigns.length);
        },
        canGoPreviousPage() {
            return this.currentPage > 1;
        },
        canGoNextPage() {
            return this.currentPage < this.totalPages;
        },
        yesterdayDate() {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            return yesterday.toLocaleDateString('en-US', options);
        },
        totals() {
            const result = this.filteredCampaigns.reduce((acc, campaign) => {
                const impressions = Number(campaign.impressions) || 0;
                const ctr = Number(campaign.ctr);
                acc.cost += Number(campaign.cost) || 0;
                acc.impressions += impressions;
                acc.clicks += Number(campaign.clicks) || 0;
                acc.installs += Number(campaign.installs) || 0;
                acc.inAppActions += Number(campaign.inAppActions) || 0;
                if (Number.isFinite(ctr) && impressions > 0) {
                    acc.ctrWeightedSum += ctr * impressions;
                    acc.ctrImpressions += impressions;
                }
                return acc;
            }, {
                cost: 0,
                impressions: 0,
                clicks: 0,
                installs: 0,
                inAppActions: 0,
                costPerAction: 0,
                ctrWeightedSum: 0,
                ctrImpressions: 0,
                ctr: 0,
            });
            if (result.ctrImpressions > 0) {
                result.ctr = (result.ctrWeightedSum / result.ctrImpressions).toFixed(2);
            } else if (this.filteredCampaigns.length > 0 && Number(result.impressions) > 0) {
                result.ctr = ((Number(result.clicks) / Number(result.impressions)) * 100).toFixed(2);
            } else {
                result.ctr = '0.00';
            }
            return result;
        },
        hasCampaignId() {
            return this.showCampaignIdColumn;
        },
        filteredAvailableAccounts() {
            let result = this.availableAccounts;
            if (this.accountSearchQuery) {
                const query = this.accountSearchQuery.toLowerCase();
                result = result.filter(account =>
                    account.name.toLowerCase().includes(query) ||
                    account.phone.toLowerCase().includes(query)
                );
            }
            return result;
        },
        allAccountsSelected() {
            return this.filteredAvailableAccounts.length > 0 &&
                this.filteredAvailableAccounts.every(account => this.modalSelectedAccounts.includes(account.id));
        },
        filteredAllFilters() {
            if (!this.filterSearchQuery) return this.allFilters;
            const query = this.filterSearchQuery.toLowerCase();
            return this.allFilters.filter(filter =>
                filter.name.toLowerCase().includes(query) ||
                filter.description.toLowerCase().includes(query)
            );
        },
        displayFilters() {
            // 合并并去重所有 filters
            const allFilterIds = new Set();
            const result = [];

            // 添加 all filters 中不重复的
            for (const filter of this.allFilters) {
                if (!allFilterIds.has(filter.id)) {
                    allFilterIds.add(filter.id);
                    result.push(filter);
                }
            }

            return result;
        },
        activeFilterTag() {
            if (this.campaignNameFilter && this.selectedFilterName) {
                return `${this.selectedFilterName} ${this.filterOperator} ${this.campaignNameFilter}`;
            }
            return null;
        },
        totalColumnWidth() {
            return this.columnOrder.reduce((total, columnKey) => {
                if (columnKey === 'campaignId' && !this.hasCampaignId) return total;
                return total + this.getColumnWidth(columnKey);
            }, 0);
        },
        tableColumnStyle() {
            const style = {
                '--table-total-width': `${this.totalColumnWidth}px`
            };
            this.columnOrder.forEach(columnKey => {
                if (columnKey === 'campaignId' && !this.hasCampaignId) {
                    style[`--table-col-${this.columnCssVarNames[columnKey]}`] = '0px';
                } else {
                    style[`--table-col-${this.columnCssVarNames[columnKey]}`] = `${this.getColumnWidth(columnKey)}px`;
                }
            });
            return style;
        }
    },
    methods: {
        handleSave() {
            this.isSaved = true;
            this.savedLabel = `Saved in ${this.modalSelectedAccounts[0]} (${this.modalSelectedAccounts[1]})`;
        },
        aggregateCampaigns(campaigns) {
            const aggregatedMap = {};
            
            campaigns.forEach(campaign => {
                const key = campaign.campaign;
                if (!aggregatedMap[key]) {
                    aggregatedMap[key] = {
                        campaign: campaign.campaign,
                        campaignId: campaign.campaignId,
                        cost: 0,
                        impressions: 0,
                        clicks: 0,
                        installs: 0,
                        inAppActions: 0,
                        id: campaign.id || key
                    };
                }
                
                const agg = aggregatedMap[key];
                agg.cost += Number(campaign.cost) || 0;
                agg.impressions += Number(campaign.impressions) || 0;
                agg.clicks += Number(campaign.clicks) || 0;
                agg.installs += Number(campaign.installs) || 0;
                agg.inAppActions += Number(campaign.inAppActions) || 0;
            });
            
            // 计算派生字段
            Object.values(aggregatedMap).forEach(agg => {
                agg.costPerInstall = agg.installs > 0 ? agg.cost / agg.installs : 0;
                agg.costPerInAppActions = agg.inAppActions > 0 ? agg.cost / agg.inAppActions : 0;
                agg.ctr = agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0;
            });
            
            return Object.values(aggregatedMap);
        },
        toggleRightPanel() {
            this.showRightPanel = !this.showRightPanel;
        },
        closeRightPanel() {
            this.showRightPanel = false;
        },
        toggleCampaignIdColumnVisibility() {
            this.showCampaignIdColumn = !this.showCampaignIdColumn;
            localStorage.setItem('showCampaignIdColumn', this.showCampaignIdColumn);
        },
        handleKeyboardShortcut(event) {
            if (event.key.toLowerCase() !== 'h') return;
            const now = Date.now();
            if (now - this.lastHKeyPressAt <= 400) {
                this.toggleCampaignIdColumnVisibility();
                this.lastHKeyPressAt = 0;
            } else {
                this.lastHKeyPressAt = now;
            }
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
                const d = new Date(year, month, -startDay + i + 1);
                currentWeek.push({ date: d, isCurrentMonth: false });
            }
            for (let i = 1; i <= lastDay.getDate(); i++) {
                currentWeek.push({ date: new Date(year, month, i), isCurrentMonth: true });
                if (weeks.length === 0) {
                    firstWeekCurrentMonthDays++;
                }
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
            return {
                weeks: weeks,
                firstWeekCurrentMonthDays: firstWeekCurrentMonthDays
            };
        },
        formatDate(date) {
            const d = new Date(date);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = monthNames[d.getMonth()];
            const day = d.getDate();
            const year = d.getFullYear();
            return `${month} ${day}, ${year}`;
        },
        getDateOptionLabel(option) {
            const labels = {
                'today': 'Today',
                'yesterday': 'Yesterday',
                'thisWeekSunSat': 'This week (Sun - Today)',
                'thisWeekMonSun': 'This week (Mon - Today)',
                'last7Days': 'Last 7 days (up to yesterday)',
                'lastWeekSunSat': 'Last week (Sun - Sat)',
                'lastWeekMonSun': 'Last week (Mon - Sun)',
                'lastBusinessWeek': 'Last business week (Mon - Fri)',
                'last14Days': 'Last 14 days (up to yesterday)',
                'thisMonth': 'This month',
                'last30Days': 'Last 30 days',
                'lastMonth': 'Last month',
                'allTime': 'All time',
                'custom': 'Custom'
            };
            return labels[option] || 'Custom';
        },
        isSameDay(date1, date2) {
            if (!date1 || !date2) return false;
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        },
        isInRange(date) {
            if (!this.draftStartDate || !this.draftEndDate) return false;
            const d = new Date(date);
            return d >= new Date(this.draftStartDate) && d <= new Date(this.draftEndDate);
        },
        toggleDatePicker(event) {
            event.stopPropagation();
            if (this.showDatePicker) {
                this.cancelDateRange();
                return;
            }

            this.showDatePicker = true;
            if (this.showDatePicker) {
                this.resetDraftDateRange();
                if (this.draftStartDate) {
                    this.calendarMonth = new Date(this.draftStartDate);
                } else {
                    this.calendarMonth = new Date();
                }
                this.$nextTick(() => {
                    this.scrollToSelectedDate();
                });
            }
        },
        scrollToSelectedDate() {
            const scrollContainer = document.querySelector('.calendar-months-scroll');
            if (!scrollContainer || !this.draftStartDate) return;
            const selectedDayElement = document.querySelector('.calendar-day.selected');
            if (selectedDayElement) {
                selectedDayElement.scrollIntoView({
                    behavior: 'auto',
                    block: 'center'
                });
            }
        },
        handleClickOutside(event) {
            if (this.showDatePicker) {
                const datePickerEl = document.querySelector('.date-picker-dropdown');
                const dateSelectEl = this.$refs.dateSelectRef;
                if (datePickerEl && !datePickerEl.contains(event.target) &&
                    dateSelectEl && !dateSelectEl.contains(event.target)) {
                    this.cancelDateRange();
                }
            }
        },
        selectDateOption(option, options = {}) {
            this.selectedDateOption = option;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            switch (option) {
                case 'today':
                    this.draftStartDate = new Date(today);
                    this.draftEndDate = new Date(today);
                    break;
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    this.draftStartDate = new Date(yesterday);
                    this.draftEndDate = new Date(yesterday);
                    break;
                case 'thisWeekSunSat':
                    const thisWeekStartSun = new Date(today);
                    const dayOfWeekSun = thisWeekStartSun.getDay();
                    const diffToSun = dayOfWeekSun;
                    thisWeekStartSun.setDate(thisWeekStartSun.getDate() - diffToSun);
                    this.draftStartDate = new Date(thisWeekStartSun);
                    this.draftEndDate = new Date(today);
                    break;
                case 'thisWeekMonSun':
                    const thisWeekStartMon = new Date(today);
                    const dowMon = thisWeekStartMon.getDay();
                    const diffToMon = dowMon === 0 ? 6 : dowMon - 1;
                    thisWeekStartMon.setDate(thisWeekStartMon.getDate() - diffToMon);
                    this.draftStartDate = new Date(thisWeekStartMon);
                    this.draftEndDate = new Date(today);
                    break;
                case 'last7Days':
                    const last7Days = new Date(today);
                    last7Days.setDate(last7Days.getDate() - 7);
                    this.draftStartDate = last7Days;
                    const yesterdayFor7 = new Date(today);
                    yesterdayFor7.setDate(yesterdayFor7.getDate() - 1);
                    this.draftEndDate = yesterdayFor7;
                    break;
                case 'lastWeekSunSat':
                    const lastWeekSunSat = new Date(today);
                    const dayOfWeek = lastWeekSunSat.getDay();
                    const diffToLastSun = dayOfWeek === 0 ? 7 : dayOfWeek;
                    lastWeekSunSat.setDate(lastWeekSunSat.getDate() - diffToLastSun);
                    this.draftStartDate = new Date(lastWeekSunSat);
                    const lastSat = new Date(lastWeekSunSat);
                    lastSat.setDate(lastSat.getDate() + 6);
                    this.draftEndDate = lastSat;
                    break;
                case 'lastWeekMonSun':
                    const lastWeekMonSun = new Date(today);
                    const dow = lastWeekMonSun.getDay();
                    const diffToLastMon1 = dow === 1 ? 7 : (dow === 0 ? 6 : dow - 1);
                    lastWeekMonSun.setDate(lastWeekMonSun.getDate() - diffToLastMon1);
                    this.draftStartDate = new Date(lastWeekMonSun);
                    const lastSun = new Date(lastWeekMonSun);
                    lastSun.setDate(lastSun.getDate() + 6);
                    this.draftEndDate = lastSun;
                    break;
                case 'lastBusinessWeek':
                    const lastBusinessWeekStart = new Date(today);
                    const d = lastBusinessWeekStart.getDay();
                    const diffToLastMon2 = d === 1 ? 7 : (d === 0 ? 6 : d - 1);
                    lastBusinessWeekStart.setDate(lastBusinessWeekStart.getDate() - diffToLastMon2);
                    this.draftStartDate = new Date(lastBusinessWeekStart);
                    const lastFri = new Date(lastBusinessWeekStart);
                    lastFri.setDate(lastFri.getDate() + 4);
                    this.draftEndDate = lastFri;
                    break;
                case 'last14Days':
                    const last14Days = new Date(today);
                    last14Days.setDate(last14Days.getDate() - 14);
                    this.draftStartDate = last14Days;
                    const yesterdayFor14 = new Date(today);
                    yesterdayFor14.setDate(yesterdayFor14.getDate() - 1);
                    this.draftEndDate = yesterdayFor14;
                    break;
                case 'thisMonth':
                    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    this.draftStartDate = thisMonthStart;
                    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    this.draftEndDate = thisMonthEnd;
                    break;
                case 'last30Days':
                    const last30Days = new Date(today);
                    last30Days.setDate(last30Days.getDate() - 29);
                    this.draftStartDate = last30Days;
                    this.draftEndDate = new Date(today);
                    break;
                case 'lastMonth':
                    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    this.draftStartDate = lastMonth;
                    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                    this.draftEndDate = lastMonthEnd;
                    break;
                case 'allTime':
                    this.draftStartDate = new Date(2000, 0, 1);
                    this.draftEndDate = new Date();
                    break;
            }
            if (this.draftStartDate) {
                this.calendarMonth = new Date(this.draftStartDate);
            }
            if (option !== 'custom' && !options.skipApply) {
                return this.applyDateRange();
            }
            this.$nextTick(() => {
                this.scrollToSelectedDate();
            });
        },
        selectCalendarDate(date) {
            if (this.selectingStartDate || !this.draftStartDate) {
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
        prevMonth() {
            this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() - 1, 1);
        },
        nextMonth() {
            this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + 1, 1);
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
        applyDateRange(options = {}) {
            if (!this.draftStartDate || !this.draftEndDate) return;
            this.startDate = this.cloneDate(this.draftStartDate);
            this.endDate = this.cloneDate(this.draftEndDate);
            this.appliedDateOption = this.selectedDateOption;
            this.currentPage = 1;
            this.showDatePicker = false;
            if (options.skipRefresh) return;
            return this.runReportDataLoad();
        },
        cancelDateRange() {
            this.resetDraftDateRange();
            this.showDatePicker = false;
        },
        getColumnWidth(columnKey) {
            const width = Number(this.columnWidths[columnKey]);
            const minWidth = this.columnMinWidths[columnKey] || 88;
            if (Number.isFinite(width) && width > 0) return Math.max(minWidth, width);
            return minWidth;
        },
        getPointerClientX(event) {
            const touch = event.touches && event.touches[0]
                ? event.touches[0]
                : event.changedTouches && event.changedTouches[0];
            if (touch) return touch.clientX;
            return Number.isFinite(event.clientX) ? event.clientX : null;
        },
        startColumnResize(event, columnKey) {
            const clientX = this.getPointerClientX(event);
            if (clientX === null) return;
            this.columnResizeState = {
                columnKey,
                startX: clientX,
                startWidth: this.getColumnWidth(columnKey)
            };
            this.resizingColumn = columnKey;
            document.body.classList.add('is-column-resizing');
            document.addEventListener('mousemove', this.handleColumnResize);
            document.addEventListener('mouseup', this.stopColumnResize);
            document.addEventListener('touchmove', this.handleColumnResize, { passive: false });
            document.addEventListener('touchend', this.stopColumnResize);
            document.addEventListener('touchcancel', this.stopColumnResize);
        },
        handleColumnResize(event) {
            if (!this.columnResizeState) return;
            if (event.cancelable) event.preventDefault();
            const clientX = this.getPointerClientX(event);
            if (clientX === null) return;
            const { columnKey, startX, startWidth } = this.columnResizeState;
            const minWidth = this.columnMinWidths[columnKey] || 88;
            const nextWidth = Math.max(minWidth, Math.round(startWidth + clientX - startX));
            this.columnWidths = {
                ...this.columnWidths,
                [columnKey]: nextWidth
            };
        },
        stopColumnResize() {
            if (this.columnResizeState) {
                try {
                    localStorage.setItem('tableColumnWidths', JSON.stringify(this.columnWidths));
                } catch (error) {
                }
            }
            this.columnResizeState = null;
            this.resizingColumn = '';
            document.body.classList.remove('is-column-resizing');
            document.removeEventListener('mousemove', this.handleColumnResize);
            document.removeEventListener('mouseup', this.stopColumnResize);
            document.removeEventListener('touchmove', this.handleColumnResize);
            document.removeEventListener('touchend', this.stopColumnResize);
            document.removeEventListener('touchcancel', this.stopColumnResize);
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
        formatPercent(value) {
            const numValue = Number(value);
            if (!Number.isFinite(numValue) || numValue === 0) return '0.00%';
            return `${numValue.toFixed(2)}%`;
        },
        sortBy(key) {
            if (this.sortKey === key) {
                this.sortOrderList[key] = this.sortOrderList[key] === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortKey = key;
                this.sortOrderList[key] = 'desc';
            }
        },
        toggleSelectAll() {
            this.campaigns.forEach(campaign => {
                campaign.selected = this.selectAll;
            });
        },
        downloadReport() {
            alert('下载功能开发中...');
        },
        saveFilter() {
            localStorage.setItem('filterText', this.filterText);
        },
        clearFilter() {
            this.filterText = '';
            localStorage.removeItem('filterText');
        },
        saveAccountText() {
            localStorage.setItem('accountText', this.accountText);
        },
        clearAccountText() {
            this.accountText = '2 accounts';
            localStorage.removeItem('accountText');
        },
        formatAccountText(count) {
            return `${count} ${count === 1 ? 'account' : 'accounts'}`;
        },
        filterSelectableAccountIds(accountIds) {
            const selectableAccountIds = new Set(this.accountOptions.map(account => account.id));
            return accountIds.filter(accountId => selectableAccountIds.has(accountId));
        },
        openAccountPicker() {
            this.draftSelectedAccounts = this.filterSelectableAccountIds(this.selectedAccounts);
            this.accountSearchText = '';
            this.showAccountPicker = true;
        },
        closeAccountPicker() {
            this.draftSelectedAccounts = this.filterSelectableAccountIds(this.selectedAccounts);
            this.accountSearchText = '';
            this.showAccountPicker = false;
        },
        isDraftAccountSelected(accountId) {
            return this.draftSelectedAccounts.includes(accountId);
        },
        toggleDraftAccount(accountId) {
            if (this.isDraftAccountSelected(accountId)) {
                this.draftSelectedAccounts = this.draftSelectedAccounts.filter(id => id !== accountId);
                return;
            }
            this.draftSelectedAccounts = [...this.draftSelectedAccounts, accountId];
        },
        removeDraftAccount(accountId) {
            this.draftSelectedAccounts = this.draftSelectedAccounts.filter(id => id !== accountId);
        },
        setAllDraftAccounts() {
            this.draftSelectedAccounts = this.isAllAccountsSelected
                ? []
                : this.accountOptions.map(account => account.id);
        },
        clearDraftAccounts() {
            this.draftSelectedAccounts = [];
        },
        saveAccountSelection() {
            this.selectedAccounts = this.filterSelectableAccountIds(this.draftSelectedAccounts);
            this.draftSelectedAccounts = [...this.selectedAccounts];
            this.accountText = this.formatAccountText(this.selectedAccounts.length);
            localStorage.setItem('selectedAccounts', JSON.stringify(this.selectedAccounts));
            localStorage.setItem('accountText', this.accountText);
            this.showAccountPicker = false;
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
        formatDateForComparison(date) {
            if (!date) return '';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        async loadTableData() {
            try {
                const response = await fetch('/assets/tableData.json', { cache: 'no-store' });
                let data = await response.json();
                data = data.map((item, index) => {
                    const campaign = {
                        ...item,
                        id: item.id || `${item.campaign}-${item.date || 'no-date'}-${index}`
                    };
                    return campaign;
                });
                this.campaigns = JSON.parse(JSON.stringify(data));
            } catch (error) {
            }
        },
        async runReportDataLoad() {
            if (this.isRefreshing) return;
            this.isRefreshing = true;
            this.showPageSizeDropdown = false;
            try {
                await this.$nextTick();
                await Promise.all([
                    this.loadTableData(),
                    new Promise(resolve => setTimeout(resolve, 1400))
                ]);
                this.currentPage = 1;
            } finally {
                this.isRefreshing = false;
            }
        },
        async refreshPage() {
            this.showDatePicker = false;
            this.showRightPanel = true;
            await this.runReportDataLoad();
        },
        hideReportBootLoader() {
            const loader = document.getElementById('report-boot-loader');
            if (!loader) return;

            const startedAt = Number(window.__reportBootStartedAt || 0);
            const elapsed = startedAt ? performance.now() - startedAt : 0;
            const remaining = Math.max(0, 1000 - elapsed);

            window.setTimeout(() => {
                loader.classList.add('is-hidden');
                window.setTimeout(() => loader.remove(), 220);
            }, remaining);
        },
        togglePageSizeDropdown() {
            this.showPageSizeDropdown = !this.showPageSizeDropdown;
        },
        setPageSize(size) {
            this.pageSize = size;
            this.currentPage = 1;
            this.showPageSizeDropdown = false;
        },
        toggleFirstNotifications() {
            this.isFirstNotificationsOpen = !this.isFirstNotificationsOpen
        },
        // 账户选择器方法
        openAccountModal() {
            this.showAccountModal = true;
        },
        closeAccountModal() {
            this.showAccountModal = false;
        },
        isAccountSelected(accountId) {
            return this.modalSelectedAccounts.includes(accountId);
        },
        getAccountById(accountId) {
            return this.availableAccounts.find(account => account.id === accountId);
        },
        toggleAllAccounts() {
            if (this.allAccountsSelected) {
                // 取消选择所有
                this.filteredAvailableAccounts.forEach(account => {
                    const index = this.modalSelectedAccounts.indexOf(account.id);
                    if (index > -1) {
                        this.modalSelectedAccounts.splice(index, 1);
                    }
                });
            } else {
                // 选择所有
                this.filteredAvailableAccounts.forEach(account => {
                    if (!this.modalSelectedAccounts.includes(account.id)) {
                        this.modalSelectedAccounts.push(account.id);
                    }
                });
            }
        },
        removeAccount(accountId) {
            const index = this.modalSelectedAccounts.indexOf(accountId);
            if (index > -1) {
                this.modalSelectedAccounts.splice(index, 1);
            }
        },
        clearAllAccounts() {
            this.modalSelectedAccounts = [];
        },
        saveModalAccountSelection() {
            const count = this.modalSelectedAccounts.length;
            this.accountText = count === 1 ? '1 account' : `${count} accounts`;
            this.saveAccountText();
            this.closeAccountModal();
        },
        // Filter 选择器方法
        openFilterDropdown() {
            this.showFilterDropdown = true;
            // 添加全局点击监听来关闭弹框
            this.$nextTick(() => {
                document.addEventListener('click', this.handleFilterDropdownClickOutside);
            });
        },
        closeFilterDropdown() {
            this.showFilterDropdown = false;
            document.removeEventListener('click', this.handleFilterDropdownClickOutside);
        },
        handleFilterDropdownClickOutside(event) {
            const dropdownRef = this.$refs.filterDropdownRef;
            if (dropdownRef && !dropdownRef.contains(event.target)) {
                this.closeFilterDropdown();
            }
        },
        selectFilter(filter) {
            // 特殊处理 Campaign name - 打开二级弹框
            if (filter.id === 'campaign-name') {
                this.selectedFilterName = filter.name;
                this.filterValueInput = '';
                this.showFilterValueModal = true;
                this.showFilterDropdown = false;
            } else {
                // 其他选项也不显示在输入框中，只保存状态
                this.selectedFilterName = filter.name;
                this.filterText = '';
                this.saveFilter();
                this.closeFilterDropdown();
            }
        },
        closeFilterValueModal() {
            this.showFilterValueModal = false;
        },
        applyFilterValue() {
            setTimeout(() => {
            this.runReportDataLoad();
            }, 0.5);
            if (this.filterValueInput) {
                this.campaignNameFilter = this.filterValueInput;
                this.isFilterTagFocused = true; // 标签处于选中状态
                // 显示标签上的关闭按钮，仅在刚点击 Apply 时显示
                this.showFilterTagClose = true;
                this.isApplyJustNow = true; // 标记为刚 Apply（黑色文字）
            } else {
                this.campaignNameFilter = '';
            }
            // 清空输入框显示，不显示任何值
            this.filterText = '';
            this.saveFilter();
            this.currentPage = 1; // 重置到第一页
            this.showFilterValueModal = false;
        },
        handleGlobalClick(event) {
            // 点击外部时，标签失去焦点
            if (this.activeFilterTag) {
                const filterTag = document.querySelector('.filter-tag');
                if (filterTag && !filterTag.contains(event.target)) {
                    this.isFilterTagFocused = false;
                    this.showFilterTagClose = false;
                    this.isApplyJustNow = false;
                    this.showFilterValueModal = false; // 关闭二级弹框
                }
            }
            // 点击外部时，关闭 Cost 下拉菜单
            if (this.showCostDropdown) {
                const costMenu = document.querySelector('.cost-dropdown-menu');
                if (costMenu && !costMenu.contains(event.target)) {
                    this.showCostDropdown = false;
                }
            }
            // 点击外部时，关闭 Filter 条件弹框
            if (this.showFilterConditionModal) {
                const filterPopup = document.querySelector('.filter-condition-dropdown');
                if (filterPopup && !filterPopup.contains(event.target)) {
                    this.showFilterConditionModal = false;
                }
            }
        },
        clearActiveFilter() {
            this.campaignNameFilter = '';
            this.filterValueInput = '';
            this.selectedFilterName = '';
            this.filterText = '';
            this.saveFilter();
            this.currentPage = 1;
            this.showFilterTagClose = false;
            this.isApplyJustNow = false;
        },
        focusFilterTag() {
            this.isFilterTagFocused = true;
            // 打开二级弹框编辑
            if (this.selectedFilterName) {
                this.showFilterValueModal = true;
            }
            this.showFilterTagClose = true;
            this.isApplyJustNow = false; // 再次点击时，不是「刚 Apply」状态（文字改回蓝色）
        },
        toggleCostDropdown() {
            this.showCostDropdown = !this.showCostDropdown;
            if (this.showCostDropdown) {
                this.$nextTick(() => {
                    this.updateCostDropdownPosition();
                });
            }
        },
        updateCostDropdownPosition() {
            const trigger = this.$refs.costDropdownTrigger;
            if (trigger) {
                const rect = trigger.getBoundingClientRect();
                this.costDropdownStyle = {
                    top: rect.bottom + 4 + 'px',
                    left: rect.left + 'px'
                };
            }
        },
        selectCostOption(option) {
            this.showCostDropdown = false;
            if (option === 'Filter') {
                this.showFilterConditionModal = true;
                this.$nextTick(() => {
                    this.updateFilterConditionPosition();
                });
            }
        },
        updateFilterConditionPosition() {
            const trigger = this.$refs.costDropdownTrigger;
            if (trigger) {
                const rect = trigger.getBoundingClientRect();
                this.filterConditionStyle = {
                    top: rect.bottom + 4 + 'px',
                    left: rect.left + 'px'
                };
            }
        },
        closeFilterConditionModal() {
            this.showFilterConditionModal = false;
        },
        addNewCondition() {
            // 添加新条件的逻辑
            console.log('Add new condition clicked');
        },
        removeAllConditions() {
            this.costFilterValue = '';
            this.costFilterOperator = 'gt';
            this.appliedCostFilterValue = '';
            this.appliedCostFilterOperator = 'gt';
            this.currentPage = 1;
            this.showFilterConditionModal = false;
        },
        applyCostFilter() {
            if (this.costFilterValue) {
                this.appliedCostFilterValue = this.costFilterValue;
                this.appliedCostFilterOperator = this.costFilterOperator;
                this.currentPage = 1;
                this.showFilterConditionModal = false;
                this.runReportDataLoad();
            }
        }
    },
    async mounted() {
        await this.loadTableData();
        this.selectDateOption('yesterday', { skipApply: true });
        this.applyDateRange({ skipRefresh: true });
        this.hideReportBootLoader();
        document.addEventListener('click', this.handleClickOutside);
        document.addEventListener('click', this.handleGlobalClick);
        document.addEventListener('keydown', this.handleKeyboardShortcut);
    },
    beforeUnmount() {
        this.stopColumnResize();
        document.removeEventListener('click', this.handleClickOutside);
        document.removeEventListener('click', this.handleGlobalClick);
        document.removeEventListener('keydown', this.handleKeyboardShortcut);
    },
    watch: {
        campaigns: {
            handler(newValue) {
                this.selectAll = newValue.every(campaign => campaign.selected);
            },
            deep: true
        }
    }
}).mount('#app');
