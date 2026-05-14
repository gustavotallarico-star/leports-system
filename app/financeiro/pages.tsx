"use client";

<div className="p-10 bg-gray-100 min-h-screen">

    <h1 className="text-4xl font-bold mb-8">
        Financeiro
    </h1>

    <div className="grid grid-cols-4 gap-6 mb-8">

        <div className="bg-white p-6 rounded-2xl shadow-md">
            <p className="text-gray-500 mb-2">
                Faturamento Hoje
            </p>

            <h2 className="text-3xl font-bold text-green-600">
                R$ {faturamentoHoje.toFixed(2)}
            </h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
            <p className="text-gray-500 mb-2">
                Faturamento Mensal
            </p>

            <h2 className="text-3xl font-bold text-blue-600">
                R$ {faturamentoMes.toFixed(2)}
            </h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
            <p className="text-gray-500 mb-2">
                Contas a Receber
            </p>

            <h2 className="text-3xl font-bold text-orange-600">
                R$ {contasReceber.toFixed(2)}
            </h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
            <p className="text-gray-500 mb-2">
                Lucro do Mês
            </p>

            <h2 className="text-3xl font-bold text-purple-600">
                R$ {lucro.toFixed(2)}
            </h2>
        </div>

    </div>

</div>
    );
}