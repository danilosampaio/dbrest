var Cliente = require('./Cliente');

function Endereco() {

}

Endereco.columnDefinition = function() {
	return {
		logradouro: {
			label: 'Logradouro'
		},
		cliente: {
			label: 'Cliente',
			type: 'domain',
			model: Cliente
		}
	}
}

module.exports = Endereco;