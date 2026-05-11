export default function FinanceiroPage() {
    return (
        <div className="p-10">

            <h1 className="text-4xl font-bold mb-6">
                Financeiro
            </h1>

            <div className="grid grid-cols-3 gap-4">

                <div className="bg-green-600 text-white p-6 rounded-2xl">
                    <h2>Receitas</h2>
                    <p className="text-3xl font-bold mt-2">
                        R$ 12.500
                    </p>
                </div>

                <div className="bg-red-600 text-white p-6 rounded-2xl">
                    <h2>Despesas</h2>
                    <p className="text-3xl font-bold mt-2">
                        R$ 3.400
                    </p>
                </div>

                <div className="bg-black text-white p-6 rounded-2xl">
                    <h2>Lucro</h2>
                    <p className="text-3xl font-bold mt-2">
                        R$ 9.100
                    </p>
                </div>

            </div>

        </div>
    )
}