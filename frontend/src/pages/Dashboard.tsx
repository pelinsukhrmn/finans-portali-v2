import StockTable from '../components/dashboard/StockTable'
import PortfolioSummary from '../components/dashboard/PortfolioSummary'
import MarketTrends from '../components/dashboard/MarketTrends'
import MarketSummaryBar from '../components/dashboard/MarketSummaryBar'
import PiyasaBrifing from '../components/dashboard/PiyasaBrifing'

export default function Dashboard() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <MarketSummaryBar />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 mt-4">
        <div className="lg:col-span-3"><StockTable /></div>
        <div className="space-y-4"><PortfolioSummary /><PiyasaBrifing /><MarketTrends /></div>
      </div>
    </div>
  )
}
